'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { CheckCircle, ShoppingBag, MessageSquare, Bell, AlertCircle } from 'lucide-react';
import useNotificationStore from '@/store/useNotificationStore';
import useAuthStore from '@/store/useAuthStore';

const BROWSER_NOTIFICATION_KEY = 'quicklyway-browser-notifications';
const NOTIFICATION_SOUND_KEY = 'quicklyway-notification-sound';

/** Play a short notification sound. Tries /sounds/notification.mp3 first, then Web Audio chime. */
function playNotificationSound() {
  if (typeof window === 'undefined') return;
  try {
    const soundEnabled = localStorage.getItem(NOTIFICATION_SOUND_KEY);
    if (soundEnabled === 'false') return;
  } catch (_) {}

  const playFallbackChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const playTone = (freq, startTime, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      playTone(523.25, 0, 0.12);
      playTone(659.25, 0.14, 0.2);
    } catch (e) {
      console.warn('Notification sound failed:', e);
    }
  };

  const audio = new Audio('/sounds/notification.mp3');
  audio.volume = 0.6;
  audio.play().catch(() => playFallbackChime());
}

function requestBrowserPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function showBrowserNotification(notification) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    const stored = localStorage.getItem(BROWSER_NOTIFICATION_KEY);
    if (stored === 'false') return;
    const n = new Notification(notification.title || 'Quicklyway', {
      body: notification.body || '',
      icon: '/favicon.ico',
      tag: notification.id,
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch (e) {
    console.warn('Browser notification failed:', e);
  }
}

/** Pick icon and toast variant from notification type for better UX */
function getToastConfig(notification) {
  const type = (notification.type || 'general').toLowerCase();
  const title = (notification.title || '').toLowerCase();
  const isSuccess = type.includes('seller') || type.includes('application') || title.includes('approved') || title.includes('success');

  if (isSuccess) {
    return { variant: 'success', icon: <CheckCircle className="w-5 h-5 text-emerald-500" /> };
  }
  if (type.includes('order')) {
    return { variant: 'default', icon: <ShoppingBag className="w-5 h-5 text-primary" /> };
  }
  if (type.includes('message') || type.includes('chat')) {
    return { variant: 'default', icon: <MessageSquare className="w-5 h-5 text-primary" /> };
  }
  if (type.includes('alert') || notification.priority === 'high') {
    return { variant: 'default', icon: <AlertCircle className="w-5 h-5 text-amber-500" /> };
  }
  return { variant: 'default', icon: <Bell className="w-5 h-5 text-muted-foreground" /> };
}

export function NotificationToaster() {
  const { notifications, lastAddedId, clearLastAddedId } = useNotificationStore();
  const { isLoggedIn } = useAuthStore();
  const shownRef = useRef(null);

  useEffect(() => {
    if (!isLoggedIn || !lastAddedId) return;
    const notification = notifications.find((n) => n.id === lastAddedId);
    if (!notification || shownRef.current === lastAddedId) {
      clearLastAddedId();
      return;
    }
    shownRef.current = lastAddedId;

    const title = notification.title || 'Notification';
    const body = notification.body || '';
    const { variant, icon } = getToastConfig(notification);

    if (variant === 'success') {
      toast.success(title, {
        description: body || undefined,
        duration: 5000,
      });
    } else {
      toast(title, {
        description: body || undefined,
        duration: 5000,
        icon,
      });
    }

    playNotificationSound();
    showBrowserNotification(notification);
    clearLastAddedId();
  }, [lastAddedId, notifications, clearLastAddedId, isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn && typeof window !== 'undefined') {
      requestBrowserPermission();
    }
  }, [isLoggedIn]);

  return null;
}
