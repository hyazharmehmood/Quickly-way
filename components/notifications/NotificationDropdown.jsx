'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Bell, CheckCircle, ShoppingBag, Mail, Briefcase, User, AlertCircle } from 'lucide-react';
import { cn } from '@/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '@/hooks/useNotifications';
import useAuthStore from '@/store/useAuthStore';
import api from '@/utils/api';
import { toast } from 'sonner';
import { ViewOfferModal } from '@/components/chat/ViewOfferModal';

const NOTIFICATION_ICONS = {
  order: { Icon: ShoppingBag, bg: 'bg-primary/10', color: 'text-primary' },
  dispute: { Icon: AlertCircle, bg: 'bg-red-500/15', color: 'text-red-600 dark:text-red-400' },
  'seller.application': { Icon: CheckCircle, bg: 'bg-emerald-500/15', color: 'text-emerald-600 dark:text-emerald-400' },
  message: { Icon: Mail, bg: 'bg-sky-500/15', color: 'text-sky-600 dark:text-sky-400' },
  gig: { Icon: Briefcase, bg: 'bg-amber-500/15', color: 'text-amber-600 dark:text-amber-400' },
  brief: { Icon: Briefcase, bg: 'bg-amber-500/15', color: 'text-amber-600 dark:text-amber-400' },
  account: { Icon: User, bg: 'bg-muted', color: 'text-muted-foreground' },
  general: { Icon: Bell, bg: 'bg-muted', color: 'text-muted-foreground' },
};

function getNotificationIcon(type) {
  const key = (type || 'general').toLowerCase();
  return NOTIFICATION_ICONS[key] || NOTIFICATION_ICONS.general;
}

const isChatNotification = (n) =>
  n.type && (n.type === 'message' || n.type === 'chat');

export function NotificationDropdown({ className }) {
  const router = useRouter();
  const pathname = usePathname();
  const { role, isSeller } = useAuthStore();
  const normalizedRole = role ? String(role).toUpperCase() : '';
  const isAdmin = normalizedRole === 'ADMIN';
  const { notifications, markAsRead } = useNotifications();
  const [viewOfferModal, setViewOfferModal] = useState({ open: false, offer: null });
  const messagesPath = pathname?.startsWith('/dashboard/seller') ? '/dashboard/seller/messages' : '/messages';
  const isFreelancerView = pathname?.startsWith('/dashboard/seller');

  // Bell = other notifications only (no chat); chat has its own dropdown on MessageSquare
  const otherNotifications = notifications.filter((n) => !isChatNotification(n));
  const unreadCount = otherNotifications.filter((n) => !n.read).length;

  const getOrderPath = (orderId) => {
    if (!orderId) return null;
    // Freelancer/seller sees orders in dashboard, client in /orders
    const useFreelancerPath = isFreelancerView || (normalizedRole === 'FREELANCER') || (normalizedRole === 'CLIENT' && isSeller);
    return useFreelancerPath ? `/dashboard/seller/orders/${orderId}` : `/orders/${orderId}`;
  };

  const handleMarkOne = async (notification) => {
    if (!notification.read) {
      markAsRead([notification.id]);
    }
    const data = notification.data || {};
    const type = (notification.type || '').toLowerCase();

    // Message / Chat → messages page
    if (type === 'message' || type === 'chat') {
      if (data.conversationId) {
        router.push(`${messagesPath}?conversationId=${data.conversationId}`);
      }
      return;
    }

    // Order (including offer accepted) → order page
    if (type === 'order' && data.orderId) {
      const path = getOrderPath(data.orderId) || data.linkUrl;
      if (path) router.push(path);
      return;
    }

    // Offer rejected (order type but no orderId, has offerId) → show ViewOfferModal
    if (type === 'order' && data.offerId && !data.orderId) {
      try {
        const res = await api.get(`/offers/${data.offerId}`);
        if (res.data?.success && res.data.offer) {
          setViewOfferModal({ open: true, offer: res.data.offer });
        } else {
          router.push(data.linkUrl || (data.conversationId ? `${messagesPath}?conversationId=${data.conversationId}` : '/messages'));
        }
      } catch {
        toast.error('Failed to load offer');
        if (data.conversationId) router.push(`${messagesPath}?conversationId=${data.conversationId}`);
      }
      return;
    }

    // Dispute → order page (dispute detail shown within order) or admin dispute page
    if (type === 'dispute' && (data.orderId || data.disputeId)) {
      const orderId = data.orderId;
      const path = (isAdmin && data.linkUrl?.startsWith('/admin/') ? data.linkUrl : null)
        || (orderId ? getOrderPath(orderId) : null)
        || data.linkUrl;
      if (path) router.push(path);
      return;
    }

    // Fallback: use linkUrl if present
    if (data.linkUrl) {
      router.push(data.linkUrl);
    }
  };

  const handleMarkAll = () => {
    const unreadIds = otherNotifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length) markAsRead(unreadIds);
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'relative rounded-full hover:bg-muted transition-colors focus-visible:outline-none',
            className
          )}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 right-0 min-w-[18px] h-[18px] rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96 mt-2 rounded-xl bg-card border border-border shadow-xl p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground" onClick={handleMarkAll}>
            Mark all read
          </Button>
        </div>
            <ScrollArea className=" h-[20rem] ">
          <div className="py-1 mr-2">
            {otherNotifications.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No notifications yet.</p>
            ) : (
              otherNotifications.map((notification) => {
                const { Icon, bg, color } = getNotificationIcon(notification.type);
                const data = notification.data || {};
                const imageUrl = data.imageUrl || data.thumbnailUrl;
                const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: false });

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleMarkOne(notification)}
                    className={cn(
                      'w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-b-0',
                      notification.read ? 'bg-transparent' : 'bg-primary/[0.04]'
                    )}
                  >
                    <div className="relative shrink-0">
                      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', bg, color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      {!notification.read && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-primary border-2 border-card" aria-hidden />
                      )}
                    </div>
                    <div className=" flex-1">
                      <p className="text-sm text-foreground leading-snug">
                        {notification.title}:
                        {notification.body && (
                          <span className="text-muted-foreground font-normal text-xs break-all whitespace-normal leading-relaxed  "> {notification.body}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
                    </div>
                    {imageUrl && (
                      <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
      <ViewOfferModal
        offer={viewOfferModal.offer}
        open={viewOfferModal.open}
        onOpenChange={(open) => setViewOfferModal((p) => ({ ...p, open }))}
      />
    </DropdownMenu>
  );
}
