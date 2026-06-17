import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import api from './supabaseClient';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface AdminNotification {
  id: string;
  type: string;
  payload: {
    title: string;
    message?: string;
    [key: string]: unknown;
  };
  page_context: string;  // maps to a sidebar item id, e.g. 'tickets', 'interactions'
  target_role: string;
  created_at: string;
  read_at: string | null;
}

interface RealtimeNotificationContextType {
  notifications: AdminNotification[];
  /** The latest notification inserted, to trigger list updates dynamically */
  lastNotificationEvent: AdminNotification | null;
  /** Total unread count (all pages) */
  unreadCount: number;
  /** Unread count for a specific page_context (sidebar badge) */
  unreadCountFor: (pageContext: string) => number;
  /** Mark a single notification as read */
  markAsRead: (id: string) => Promise<void>;
  /** Mark ALL notifications for a given page_context as read */
  markAllReadFor: (pageContext: string) => Promise<void>;
  isLoading: boolean;
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────

const RealtimeNotificationContext = createContext<
  RealtimeNotificationContextType | undefined
>(undefined);

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

export function RealtimeNotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [lastNotificationEvent, setLastNotificationEvent] = useState<AdminNotification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // ── 1. Fetch existing unread notifications on mount ──
  const fetchUnread = useCallback(async () => {
    try {
      const { data, error } = await (api.supabase as any)
        .from('admin_notifications')
        .select('id, type, payload, page_context, target_role, created_at, read_at')
        .is('read_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[RealtimeNotifications] fetch error:', error.message);
        return;
      }
      setNotifications((data as AdminNotification[]) ?? []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── 2. Subscribe to real-time INSERT events ──
  useEffect(() => {
    fetchUnread();

    const channel = (api.supabase as any)
      .channel('admin_notifications_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications',
        },
        (payload: any) => {
          const newItem = payload.new as AdminNotification;
          setLastNotificationEvent(newItem);
          setNotifications((prev) => {
            // Avoid duplicates (Supabase can fire twice in dev strict mode)
            if (prev.some((n) => n.id === newItem.id)) return prev;
            return [newItem, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admin_notifications',
        },
        (payload: any) => {
          const updated = payload.new as AdminNotification;
          if (updated.read_at !== null) {
            // Remove from unread list when read_at is set
            setNotifications((prev) => prev.filter((n) => n.id !== updated.id));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [fetchUnread]);

  // ── 3. Mark single notification as read ──
  const markAsRead = useCallback(async (id: string) => {
    // Optimistic UI – remove from list immediately
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    const { error } = await (api.supabase as any)
      .from('admin_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('[RealtimeNotifications] markAsRead error:', error.message);
      // Rollback: re-fetch
      fetchUnread();
    }
  }, [fetchUnread]);

  // ── 4. Mark ALL for a page_context as read ──
  const markAllReadFor = useCallback(async (pageContext: string) => {
    const ids = notifications
      .filter((n) => n.page_context === pageContext && n.read_at === null)
      .map((n) => n.id);

    if (ids.length === 0) return;

    // Optimistic UI
    setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));

    const { error } = await (api.supabase as any)
      .from('admin_notifications')
      .update({ read_at: new Date().toISOString() })
      .in('id', ids);

    if (error) {
      console.error('[RealtimeNotifications] markAllReadFor error:', error.message);
      fetchUnread();
    }
  }, [notifications, fetchUnread]);

  // ── 5. Helper selectors ──
  const unreadCount = notifications.length;

  const unreadCountFor = useCallback(
    (pageContext: string) =>
      notifications.filter((n) => n.page_context === pageContext).length,
    [notifications]
  );

  return (
    <RealtimeNotificationContext.Provider
      value={{
        notifications,
        lastNotificationEvent,
        unreadCount,
        unreadCountFor,
        markAsRead,
        markAllReadFor,
        isLoading,
      }}
    >
      {children}
    </RealtimeNotificationContext.Provider>
  );
}

// ─────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────

export function useRealtimeNotifications() {
  const ctx = useContext(RealtimeNotificationContext);
  if (!ctx) {
    throw new Error(
      'useRealtimeNotifications must be used within a RealtimeNotificationProvider'
    );
  }
  return ctx;
}

/**
 * Hook to auto-refresh list or page state when a matching notification is received.
 * @param pageContext The sidebar item id / page context to match
 * @param onNotification Callback to trigger (e.g. reload function)
 */
export function useRefreshOnNotification(pageContext: string, onNotification: () => void) {
  const { lastNotificationEvent } = useRealtimeNotifications();

  useEffect(() => {
    if (lastNotificationEvent && lastNotificationEvent.page_context === pageContext) {
      onNotification();
    }
  }, [lastNotificationEvent, pageContext, onNotification]);
}
