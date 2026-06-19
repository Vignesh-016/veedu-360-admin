import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useRealtimeNotifications } from '../lib/RealtimeNotificationContext';
import { appNavigationItems } from '../lib/navigationConfig';
import {
    IconLogout,
    IconLogin,
    IconMenu2,
    IconX,
    IconUserCircle,
    IconBell,
    IconBellRinging,
    IconCheck,
    IconChecks,
} from '@tabler/icons-react';

interface NavbarProps {
    onMenuToggle: () => void;
}

// ─── Notification Dropdown ────────────────────────────────────
function NotificationDropdown({ onClose }: { onClose: () => void }) {
    const { notifications, markAsRead, markAllReadFor } = useRealtimeNotifications();
    const navigate = useNavigate();

    // Group by page_context for display
    const grouped = notifications.slice(0, 30); // cap at 30 items in dropdown

    const getPageLabel = (pageContext: string) => {
        const item = appNavigationItems.find(n => n.id === pageContext);
        return item?.label ?? pageContext;
    };

    const getPagePath = (pageContext: string) => {
        const item = appNavigationItems.find(n => n.id === pageContext);
        return item?.path ?? '/dashboard';
    };

    const handleItemClick = async (notif: typeof notifications[number]) => {
        await markAsRead(notif.id);
        navigate(getPagePath(notif.page_context));
        onClose();
    };

    const handleMarkAllRead = async () => {
        const contexts = [...new Set(notifications.map(n => n.page_context))];
        await Promise.all(contexts.map(ctx => markAllReadFor(ctx)));
    };

    const timeAgo = (dateStr: string) => {
        const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    return (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-2">
                    <IconBellRinging size={18} className="text-[#D9A619]" />
                    <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
                    {notifications.length > 0 && (
                        <span className="text-xs bg-rose-100 text-rose-600 font-bold px-2 py-0.5 rounded-full">
                            {notifications.length} new
                        </span>
                    )}
                </div>
                {notifications.length > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                    >
                        <IconChecks size={14} />
                        Mark all read
                    </button>
                )}
            </div>

            {/* List */}
            <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
                {grouped.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <IconCheck size={32} className="mb-2 text-gray-300" />
                        <p className="text-sm font-medium">You're all caught up!</p>
                        <p className="text-xs mt-0.5">No new notifications</p>
                    </div>
                ) : (
                    grouped.map((notif) => (
                        <button
                            key={notif.id}
                            onClick={() => handleItemClick(notif)}
                            className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-amber-50 transition-colors group"
                        >
                            {/* Unread dot */}
                            <span className="mt-1.5 flex-shrink-0 h-2 w-2 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 animate-pulse" />

                            <div className="flex-1 min-w-0">
                                {/* Page label pill */}
                                <span className="inline-block text-[10px] font-semibold uppercase tracking-wide text-[#D9A619] bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded mb-1">
                                    {getPageLabel(notif.page_context)}
                                </span>
                                <p className="text-sm font-semibold text-gray-800 truncate">
                                    {notif.payload?.title ?? 'New notification'}
                                </p>
                                {notif.payload?.message && (
                                    <p className="text-xs text-gray-500 truncate mt-0.5">
                                        {notif.payload.message}
                                    </p>
                                )}
                                <p className="text-[10px] text-gray-400 mt-1">
                                    {timeAgo(notif.created_at)}
                                </p>
                            </div>

                            {/* Mark read icon on hover */}
                            <IconCheck
                                size={14}
                                className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 text-gray-400 transition-opacity"
                            />
                        </button>
                    ))
                )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
                <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 text-center">
                    <p className="text-xs text-gray-400">
                        Showing {Math.min(grouped.length, 30)} of {notifications.length} unread
                    </p>
                </div>
            )}
        </div>
    );
}

// ─── Navbar ───────────────────────────────────────────────────
export default function Navbar({ onMenuToggle }: NavbarProps) {
    const { user, signOut } = useAuth();
    const { unreadCount } = useRealtimeNotifications();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    const handleToggleClick = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
        onMenuToggle();
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30 h-16 flex-shrink-0">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Left: Logo + Mobile toggle */}
                    <div className="flex items-center">
                        <Link to="/dashboard" className="flex-shrink-0 flex items-center">
                            <img className="h-20 w-auto" src="/veedu360-logo.png" alt="Company Logo" />
                        </Link>

                        {user && (
                            <div className="ml-4 md:hidden">
                                <button
                                    onClick={handleToggleClick}
                                    type="button"
                                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-500"
                                    aria-controls="mobile-menu"
                                    aria-expanded={isMobileMenuOpen}
                                >
                                    <span className="sr-only">Open sidebar</span>
                                    {isMobileMenuOpen ? (
                                        <IconX size={24} aria-hidden="true" />
                                    ) : (
                                        <IconMenu2 size={24} aria-hidden="true" />
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right: Bell + User */}
                    <div className="flex items-center gap-3">
                        {user && (
                            <>
                                {/* ── Notification Bell ── */}
                                <div className="relative" ref={notifRef}>
                                    <button
                                        id="admin-notif-bell"
                                        onClick={() => setIsNotifOpen(prev => !prev)}
                                        className="relative flex items-center justify-center h-9 w-9 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#D9A619]"
                                        aria-label="Notifications"
                                    >
                                        {unreadCount > 0 ? (
                                            <IconBellRinging size={20} className="text-[#D9A619]" />
                                        ) : (
                                            <IconBell size={20} />
                                        )}

                                        {/* Badge */}
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[9px] font-bold text-white bg-gradient-to-r from-rose-500 to-pink-600 rounded-full shadow ring-2 ring-white animate-bounce">
                                                {unreadCount > 99 ? '99+' : unreadCount}
                                            </span>
                                        )}
                                    </button>

                                    {/* Dropdown */}
                                    {isNotifOpen && (
                                        <NotificationDropdown onClose={() => setIsNotifOpen(false)} />
                                    )}
                                </div>

                                {/* ── User email ── */}
                                <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                                    <IconUserCircle size={20} className="text-gray-500" />
                                    <span className="truncate max-w-[150px] lg:max-w-xs" title={user.email ?? undefined}>
                                        {user.email}
                                    </span>
                                </div>

                                {/* ── Sign out ── */}
                                <button
                                    onClick={signOut}
                                    className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                >
                                    <IconLogout size={18} className="mr-1.5 text-gray-500" />
                                    <span className="hidden sm:inline">Sign Out</span>
                                </button>
                            </>
                        )}

                        {!user && (
                            <Link
                                to="/login"
                                className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                            >
                                <IconLogin size={18} className="mr-1.5" />
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}