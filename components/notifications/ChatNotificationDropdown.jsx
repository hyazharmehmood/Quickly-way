'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { MessageSquare, Mail, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { formatDistanceToNow } from 'date-fns';
import useChatUnreadStore from '@/store/useChatUnreadStore';

const NOTIFICATION_SOUND_KEY = 'quicklyway-notification-sound';

export function ChatNotificationDropdown({ className }) {
  const router = useRouter();
  const pathname = usePathname();
  const { totalUnread: chatUnreadCount, conversationsWithUnread } = useChatUnreadStore();
  const messagesPath = pathname?.startsWith('/dashboard/seller')
    ? '/dashboard/seller/messages'
    : '/messages';

  const [soundOn, setSoundOn] = useState(true);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(NOTIFICATION_SOUND_KEY);
    setSoundOn(stored !== 'false');
  }, []);

  const handleSoundToggle = (checked) => {
    setSoundOn(checked);
    try {
      localStorage.setItem(NOTIFICATION_SOUND_KEY, checked ? 'true' : 'false');
    } catch (_) {}
  };

  const handleOpenChat = (conversationId) => {
    router.push(`${messagesPath}?conversationId=${conversationId}`);
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
          aria-label="Chat notifications"
        >
          <MessageSquare className="w-6 h-6 text-gray-900" />
          {chatUnreadCount > 0 && (
            <span className="absolute -top-1 right-0.5 min-w-[18px] h-[18px] rounded-full bg-primary text-[10px] text-white flex items-center justify-center px-1 font-medium">
              {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-96 mt-2 rounded-xl bg-card border border-border shadow-xl p-0"
        align="end"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Chat notifications</p>
          <div className="flex items-center justify-between gap-3">
            <span onClick={() => handleSoundToggle(!soundOn)} className="text-xs  flex items-center gap-2">
              {soundOn ? <Volume2 className="w-4 h-4 cursor-pointer text-primary   " /> : <VolumeX className="w-4 h-4 cursor-pointer  text-muted-foreground" />}

            </span>
            
          </div>
        </div>
        <ScrollArea className="h-80">
          <div className="py-1 mr-2">
            {conversationsWithUnread.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <p className="text-sm text-muted-foreground mb-3">No new messages</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => router.push(messagesPath)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Open Inbox
                </Button>
              </div>
            ) : (
              conversationsWithUnread.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => handleOpenChat(conv.id)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-b-0 bg-green-500/5"
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500/15 text-green-600 dark:text-green-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    {conv.unreadCount > 0 && (
                      <span
                        className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-green-500 text-[10px] text-white flex items-center justify-center"
                        aria-hidden
                      >
                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {conv.otherParticipant?.name || 'Unknown'}
                    </p>
                    {conv.lastMessageText && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conv.lastMessageText}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {conv.lastMessageAt
                        ? formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })
                        : ''}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
        <div className="p-3 border-t border-border space-y-2">
        
          {conversationsWithUnread.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground hover:text-foreground"
              onClick={() => router.push(messagesPath)}
            >
              Open Inbox
            </Button>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
