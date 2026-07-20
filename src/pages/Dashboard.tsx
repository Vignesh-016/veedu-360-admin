import { useAuth } from '../lib/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { Helmet } from 'react-helmet-async';
import { IconRefresh, IconAlertCircle } from '@tabler/icons-react';
import { useRealtimeNotifications } from '../lib/RealtimeNotificationContext';
import { getBaseCardClasses, getSecondaryButtonClasses } from '../lib/twUtils';
import { appNavigationItems, AppNavigationItem } from '../lib/navigationConfig';
import DashboardCharts from '../components/dashboard/DashboardCharts';

function Dashboard() {
    const {
        user,
        loading: authLoading,
        isSuperAdmin,
        roles: userRoles,
        dashboardStats: stats,
        statsLoading,
        statsError,
        refetchDashboardStats
    } = useAuth();

    if (authLoading && !user) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <LoadingSpinner size={40} />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const { getModuleNotificationCount } = useRealtimeNotifications();

    const visibleDashboardCards = appNavigationItems.filter(item => {
        if (!item.isDashboardCard) return false;
        if (isSuperAdmin) return true;
        if (!item.allowedRoles || item.allowedRoles.length === 0) return true;
        return item.allowedRoles.some(role => userRoles.includes(role));
    });

    const companyName = import.meta.env.VITE_COMPANY_NAME || "Admin Panel";

    return (
        <>
            <Helmet>
                <title>{`Dashboard | ${companyName}`}</title>
            </Helmet>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-10 px-4 sm:px-6 lg:px-8">
                <div className="container mx-auto">
                    <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h1>
                            <p className="text-gray-600">Welcome, {user.email?.split('@')[0] || 'Admin'}!</p>
                        </div>
                        {isSuperAdmin && (
                            <button
                                onClick={refetchDashboardStats}
                                className={getSecondaryButtonClasses()}
                                disabled={statsLoading}
                                title="Refresh Stats"
                            >
                                {statsLoading ? <LoadingSpinner size={16} /> : <IconRefresh size={16} />}
                                <span className="ml-2">Refresh Stats</span>
                            </button>
                        )}
                    </div>

                    {isSuperAdmin && statsError && !statsLoading && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md shadow flex items-center justify-between">
                            <div className='flex items-center'>
                                <IconAlertCircle className="h-5 w-5 mr-3" />
                                <span>Error loading dashboard stats: {statsError}</span>
                            </div>
                            <button onClick={refetchDashboardStats} className={`${getSecondaryButtonClasses()} text-xs py-1 px-2 border-red-300 hover:bg-red-100 text-red-700`}>
                                Retry
                            </button>
                        </div>
                    )}

                    {isSuperAdmin && (
                        <DashboardCharts
                            stats={stats}
                            statsLoading={statsLoading}
                            statsError={statsError}
                            refetchDashboardStats={refetchDashboardStats}
                        />
                    )}

                    <div className={`${isSuperAdmin ? 'mt-12 pt-8 border-t border-gray-200' : 'mt-0'}`}>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Management Areas</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {visibleDashboardCards.map((card: AppNavigationItem) => (
                                <Link key={card.id} to={card.path} className="group block">
                                    <div className={`${getBaseCardClasses()} h-full p-5 flex items-start space-x-4 hover:border-[#c49a17] hover:shadow-lg transition-all duration-200`}>
                                        <div className="flex-shrink-0 bg-gray-100 text-[#D9A619] p-3 rounded-lg group-hover:bg-[#D9A619] group-hover:text-white transition-colors">
                                            {card.icon}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-lg text-gray-800 group-hover:text-[#c49a17] truncate">{card.label}</h3>
                                                {getModuleNotificationCount(card.id) > 0 && (
                                                    <span className="inline-flex items-center justify-center rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                                                        {getModuleNotificationCount(card.id) > 99 ? '99+' : getModuleNotificationCount(card.id)}
                                                    </span>
                                                )}
                                            </div>
                                            {card.description && <p className="text-sm text-gray-500">{card.description}</p>}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Dashboard;