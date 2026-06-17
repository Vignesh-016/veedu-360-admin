import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import LoadingSpinner from './LoadingSpinner';

function ProtectedLayout() {
    const { user, loading } = useAuth();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const handleMenuToggle = () => {
        setIsMobileSidebarOpen(!isMobileSidebarOpen);
    };

    const handleCloseMobileSidebar = () => {
        setIsMobileSidebarOpen(false);
    };

    const toggleSidebarCollapse = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <LoadingSpinner size={40} />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Navbar: Moved to the top, full width */}
            <Navbar onMenuToggle={handleMenuToggle} />

            {/* Main Area Below Navbar */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <Sidebar
                    isMobileOpen={isMobileSidebarOpen}
                    onMobileClose={handleCloseMobileSidebar}
                    isCollapsed={isSidebarCollapsed}
                    toggleCollapse={toggleSidebarCollapse}
                />

                {/* Page Content Area */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-r from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default ProtectedLayout;