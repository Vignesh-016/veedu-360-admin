import { IconBrandGoogle, IconShield, IconUsers, IconBuilding } from '@tabler/icons-react'
import { useAuth } from '../lib/AuthContext'
import { Helmet } from 'react-helmet-async';

function Login() {
    const { signInWithGoogle, loading: authLoading } = useAuth();
    const companyName = import.meta.env.VITE_COMPANY_NAME || "Admin Panel";

    return (
        <>
            <Helmet>
                <title>{`Admin Login | ${companyName}`}</title>
            </Helmet>
            <div className="flex min-h-screen bg-white">

                {/* Left Section - Welcome Content */}
                <div className="flex flex-col justify-center w-full lg:w-1/2 p-8 md:p-16 lg:p-24 bg-gray-50">
                    <div className="max-w-md">
                        {/* Logo */}
                        <div className="mb-8">
                            <img
                                src="/logo.png"
                                alt={`${companyName} Logo`}
                                className="h-10 w-auto mb-3"
                            />
                            <div className="h-0.5 w-12 bg-blue-600 rounded-full"></div>
                        </div>

                        {/* Main Heading */}
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                            Welcome Admin!
                        </h1>

                        <p className="text-base text-gray-600 mb-10">
                            Manage your properties, customers, and operations with ease. Secure access to your admin dashboard.
                        </p>

                        {/* Feature List */}
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <IconBuilding size={16} className="text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-800">Property Management</h3>
                                    <p className="text-xs text-gray-500">Comprehensive control over all listings</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                    <IconUsers size={16} className="text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-800">Customer Insights</h3>
                                    <p className="text-xs text-gray-500">Track and manage customer interactions</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                    <IconShield size={16} className="text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-800">Secure Access</h3>
                                    <p className="text-xs text-gray-500">Enterprise-grade authentication</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section - Simple Login Card */}
                <div className="hidden lg:flex flex-col items-center justify-center w-full lg:w-1/2 bg-gradient-to-br from-[#D9A619] to-[#b88a15] p-12">

                    {/* Simple Login Card - Clean & Minimal */}
                    <div className="w-full max-w-md">
                        <div className="bg-white rounded-2xl shadow-xl p-10">
                            {/* Header */}
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    Sign In
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Access your account or get started
                                </p>
                            </div>

                            {/* Google Sign In Button - Clean Style */}
                            <button
                                onClick={signInWithGoogle}
                                disabled={authLoading}
                                className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <IconBrandGoogle size={20} className="text-gray-700" />
                                <span>Sign in with Google</span>
                            </button>

                            {authLoading && (
                                <div className="mt-6 text-center">
                                    <div className="inline-flex items-center space-x-2 text-gray-500">
                                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-sm">Authenticating...</span>
                                    </div>
                                </div>
                            )}

                            {/* Footer */}
                            <p className="mt-6 text-center text-xs text-gray-400">
                                By signing in, you agree to our terms and privacy policy
                            </p>
                        </div>

                        {/* Support Link */}
                        <p className="mt-6 text-center text-sm text-white">
                            Need help? <a href="#" className="font-medium underline hover:no-underline">Contact Support</a>
                        </p>
                    </div>
                </div>

                {/* Mobile Login Section - Bottom Sheet */}
                <div className="lg:hidden fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl p-6 z-20 border-t border-gray-200">
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-1">
                            Sign In
                        </h2>
                        <p className="text-sm text-gray-500">
                            Access your admin dashboard
                        </p>
                    </div>

                    <button
                        onClick={signInWithGoogle}
                        disabled={authLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <IconBrandGoogle size={20} />
                        <span>Sign in with Google</span>
                    </button>

                    {authLoading && (
                        <div className="mt-4 text-center">
                            <div className="inline-flex items-center space-x-2 text-gray-500">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm">Authenticating...</span>
                            </div>
                        </div>
                    )}

                    <p className="mt-4 text-center text-xs text-gray-400">
                        By signing in, you agree to our terms and privacy policy
                    </p>
                </div>
            </div>
        </>
    );
}

export default Login;