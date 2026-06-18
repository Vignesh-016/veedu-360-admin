import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useRealtimeNotifications } from '../lib/RealtimeNotificationContext';
import {
    IconX, IconLayoutSidebarLeftCollapse, IconLayoutSidebarRightCollapse
} from '@tabler/icons-react';
import { Transition, Dialog, DialogPanel, TransitionChild } from '@headlessui/react';
import { Fragment } from 'react';
import { appNavigationItems, AppNavigationItem } from '../lib/navigationConfig';

// ─── Props ────────────────────────────────────────────────────
interface SidebarContentProps {
    isCollapsed: boolean;
    onLinkClick?: () => void;
}

interface SidebarProps {
    isMobileOpen: boolean;
    onMobileClose: () => void;
    isCollapsed: boolean;
    toggleCollapse: () => void;
}

// ─── Badge component ──────────────────────────────────────────
function NotifBadge({ count, collapsed }: { count: number; collapsed: boolean }) {
    if (count === 0) return null;
    return (
        <span
            className={`
                inline-flex items-center justify-center
                min-w-[18px] h-[18px] px-1
                text-[10px] font-bold leading-none text-white
                bg-gradient-to-r from-rose-500 to-pink-600
                rounded-full shadow-sm
                animate-pulse
                ${collapsed ? 'absolute top-1 right-1' : 'ml-auto'}
            `}
        >
            {count > 99 ? '99+' : count}
        </span>
    );
}

// ─── Sidebar Content ──────────────────────────────────────────
function SidebarContent({ isCollapsed, onLinkClick }: SidebarContentProps) {
    const { user, roles: userRoles = [], isSuperAdmin } = useAuth();
    const { unreadCountFor, markAllReadFor } = useRealtimeNotifications();
    const navigate = useNavigate();

    if (!user) return null;

    const commonLinkClasses = `relative flex items-center px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ease-in-out group`;
    const inactiveLinkClasses = 'text-gray-600 hover:bg-gray-200 hover:text-gray-900';
    const activeLinkClasses   = 'bg-[#D9A619] text-white font-semibold';
    const collapsedLinkClasses = 'justify-center';

const normalizedRoles = userRoles.map((role) =>
    String(role).toLowerCase().trim()
);

const hasFullAccess =
    isSuperAdmin ||
    normalizedRoles.includes('super-admin') ||
    normalizedRoles.includes('super_admin') ||
    normalizedRoles.includes('superadmin') ||
    normalizedRoles.includes('admin');

const visibleSidebarItems = appNavigationItems.filter((item) => {
    if (!item.isSidebarLink) return false;
    if (hasFullAccess) return true;
    if (!item.allowedRoles || item.allowedRoles.length === 0) return true;

    return item.allowedRoles.some((role) =>
        normalizedRoles.includes(String(role).toLowerCase().trim())
    );
});

    const handleNavClick = async (item: AppNavigationItem) => {
        // Mark all notifications for this page as read when the admin navigates to it
        if (unreadCountFor(item.id) > 0) {
            await markAllReadFor(item.id);
        }
        onLinkClick?.();
        navigate(item.path);
    };

    return (
        <nav className={`flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden ${isCollapsed ? 'scrollbar-hide' : ''}`}>
            {visibleSidebarItems.map((item: AppNavigationItem) => {
                const count = unreadCountFor(item.id);
                return (
                    <NavLink
                        key={item.id}
                        to={item.path}
                        onClick={() => handleNavClick(item)}
                        className={({ isActive }) =>
                            `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses} ${isCollapsed ? collapsedLinkClasses : ''}`
                        }
                        title={isCollapsed ? item.label : undefined}
                    >
                        <span className={`flex-shrink-0 h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`}>
                            {item.icon}
                        </span>

                        {!isCollapsed && (
                            <>
                                <span className="truncate transition-opacity duration-200 delay-100 ease-in-out flex-1">
                                    {item.label}
                                </span>
                                <NotifBadge count={count} collapsed={false} />
                            </>
                        )}

                        {/* Collapsed mode: dot badge in top-right corner */}
                        {isCollapsed && count > 0 && (
                            <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-gray-100 animate-pulse" />
                        )}
                    </NavLink>
                );
            })}
        </nav>
    );
}

// ─── Main Sidebar Component ───────────────────────────────────
export default function Sidebar({ isMobileOpen, onMobileClose, isCollapsed, toggleCollapse }: SidebarProps) {
    return (
        <>
            {/* ── Mobile Sidebar (Dialog) ── */}
            <Transition show={isMobileOpen} as={Fragment}>
                <Dialog as="div" className="relative z-40 md:hidden" onClose={onMobileClose}>
                    <TransitionChild
                        as={Fragment}
                        enter="transition-opacity ease-linear duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity ease-linear duration-300"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-[#D9A619] bg-opacity-75" />
                    </TransitionChild>

                    <div className="fixed inset-0 flex z-40">
                        <TransitionChild
                            as={Fragment}
                            enter="transition ease-in-out duration-300 transform"
                            enterFrom="-translate-x-full"
                            enterTo="translate-x-0"
                            leave="transition ease-in-out duration-300 transform"
                            leaveFrom="translate-x-0"
                            leaveTo="-translate-x-full"
                        >
                            <DialogPanel className="relative flex-1 flex flex-col max-w-xs w-full bg-gray-100 border-r border-gray-200">
                                <div className="absolute top-0 right-0 -mr-12 pt-2">
                                    <button
                                        type="button"
                                        className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                        onClick={onMobileClose}
                                    >
                                        <span className="sr-only">Close sidebar</span>
                                        <IconX className="h-6 w-6 text-[#D9A619]" aria-hidden="true" />
                                    </button>
                                </div>
                                <SidebarContent isCollapsed={false} onLinkClick={onMobileClose} />
                            </DialogPanel>
                        </TransitionChild>
                        <div className="flex-shrink-0 w-14" aria-hidden="true" />
                    </div>
                </Dialog>
            </Transition>

            {/* ── Desktop Sidebar ── */}
            <div className="hidden md:flex md:flex-shrink-0 h-full">
                <div className={`flex flex-col ${isCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 ease-in-out border-r border-gray-200 bg-gray-100`}>
                    <div className="flex-1 flex flex-col min-h-0">
                        <SidebarContent isCollapsed={isCollapsed} />
                        <div className="flex-shrink-0 p-2 border-t border-gray-200">
                            <button
                                onClick={toggleCollapse}
                                className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-900 hover:bg-[#D9A619] hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
                                title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                            >
                                {isCollapsed ? (
                                    <IconLayoutSidebarRightCollapse size={20} />
                                ) : (
                                    <IconLayoutSidebarLeftCollapse size={20} />
                                )}
                                <span className="sr-only">{isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}