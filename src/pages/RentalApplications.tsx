import { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import { Helmet } from 'react-helmet-async';
import { Menu, Transition, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { useSearchParams } from 'react-router-dom';
import {
    IconChevronLeft, IconChevronRight, IconHourglassHigh,
    IconCircleCheck, IconCash, IconClipboardList, IconAdjustmentsHorizontal, IconCheck
} from '@tabler/icons-react';

import LoadingSpinner from '../components/LoadingSpinner';
import { useNotification } from '../components/NotificationProvider';
import api from '../lib/supabaseClient';
import {
    RentalApplicationAdminView, AdminGetRentalApplicationsParams,
    RentalApplicationStatus, AdminRole, DashboardStats
} from '../lib/types';
import { getSecondaryButtonClasses } from '../lib/twUtils';
import RentalApplicationList from '../components/rental-applications/RentalApplicationList';
import RentalApplicationFilters from '../components/rental-applications/RentalApplicationFilters';
import RentalApplicationDetailModal from '../components/rental-applications/RentalApplicationDetailModal';
import { useAuth } from '../lib/AuthContext';
import { useRefreshOnNotification } from '../lib/RealtimeNotificationContext';

type ActiveRentalAppTab = 'all' | 'unassigned' | 'myActive' | 'awaitingPayment' | 'readyToFinalize' | 'closed';

interface RentalAppTabConfig {
    key: ActiveRentalAppTab;
    label: string;
    allowedRoles: AdminRole[];
    defaultForRoles?: AdminRole[];
}

const rentalApplicationTabs: RentalAppTabConfig[] = [
    { key: 'all', label: 'All Applications', allowedRoles: ['super-admin', 'telecalling-owner-team', 'telecalling-tenant-team', 'accounts-team'], defaultForRoles: ['super-admin'] },
    { key: 'unassigned', label: 'New & Unassigned', allowedRoles: ['super-admin', 'telecalling-owner-team', 'telecalling-tenant-team'], defaultForRoles: ['telecalling-owner-team', 'telecalling-tenant-team'] },
    { key: 'myActive', label: 'My Active Applications', allowedRoles: ['super-admin', 'telecalling-owner-team', 'telecalling-tenant-team'] },
    { key: 'awaitingPayment', label: 'Awaiting Payment', allowedRoles: ['super-admin', 'accounts-team', 'telecalling-owner-team', 'telecalling-tenant-team'], defaultForRoles: ['accounts-team'] },
    { key: 'readyToFinalize', label: 'Ready to Finalize', allowedRoles: ['super-admin', 'telecalling-owner-team', 'telecalling-tenant-team', 'accounts-team'] },
    { key: 'closed', label: 'Closed Applications', allowedRoles: ['super-admin', 'telecalling-owner-team', 'telecalling-tenant-team', 'accounts-team'] },
];

function getDefaultRentalAppTab(userRoles: AdminRole[], availableTabs: RentalAppTabConfig[]): ActiveRentalAppTab {
    for (const role of userRoles) {
        const foundDefault = availableTabs.find(tab => tab.defaultForRoles?.includes(role));
        if (foundDefault) return foundDefault.key;
    }
    return availableTabs[0]?.key || 'all';
}

function RentalApplicationsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { user: currentUser, roles: currentUserRoles, isSuperAdmin, loading: authLoading } = useAuth();
    const { showSuccessNotification, showErrorNotification } = useNotification();

    const [applications, setApplications] = useState<RentalApplicationAdminView[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoadingAppId, setActionLoadingAppId] = useState<string | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<ActiveRentalAppTab>('all');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage] = useState(15);
    const [totalCount, setTotalCount] = useState(0);
    const [isInitialUrlParseDone, setIsInitialUrlParseDone] = useState(false);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);

    // Filter States
    const [statusFilter, setStatusFilter] = useState<RentalApplicationStatus[]>([]);
    const [assignedAdminFilter, setAssignedAdminFilter] = useState<string | undefined>(undefined);
    const [propertySearchFilter, setPropertySearchFilter] = useState<string>('');
    const [applicantSearchFilter, setApplicantSearchFilter] = useState<string>('');
    const [landlordSearchFilter, setLandlordSearchFilter] = useState<string>('');
    const [submissionDateStartFilter, setSubmissionDateStartFilter] = useState<string>('');
    const [submissionDateEndFilter, setSubmissionDateEndFilter] = useState<string>('');
    const [moveInDateStartFilter, setMoveInDateStartFilter] = useState<string>('');
    const [moveInDateEndFilter, setMoveInDateEndFilter] = useState<string>('');

    const visibleTabs = useMemo(() => rentalApplicationTabs.filter(tab =>
        tab.allowedRoles.some(role => currentUserRoles.includes(role))
    ), [currentUserRoles]);

    // Sync URL to local state & set default tab
    useEffect(() => {
        if (authLoading || !currentUser || !visibleTabs.length) return;

        const pageFromUrl = Number(searchParams.get('page')) || 1;
        const tabFromUrlParams = searchParams.get('tab') as ActiveRentalAppTab | null;
        const defaultTab = getDefaultRentalAppTab(currentUserRoles, visibleTabs);
        const effectiveTabFromUrl = tabFromUrlParams && visibleTabs.find(vt => vt.key === tabFromUrlParams) ? tabFromUrlParams : defaultTab;

        setCurrentPage(pageFromUrl);
        setActiveTab(effectiveTabFromUrl);
        setAssignedAdminFilter(searchParams.get('assignedAdmin') || undefined);
        setPropertySearchFilter(searchParams.get('propertySearch') || '');
        setApplicantSearchFilter(searchParams.get('applicantSearch') || '');
        setLandlordSearchFilter(searchParams.get('landlordSearch') || '');
        setSubmissionDateStartFilter(searchParams.get('submissionStart') || '');
        setSubmissionDateEndFilter(searchParams.get('submissionEnd') || '');
        setMoveInDateStartFilter(searchParams.get('moveInStart') || '');
        setMoveInDateEndFilter(searchParams.get('moveInEnd') || '');

        if (tabFromUrlParams !== effectiveTabFromUrl || String(pageFromUrl) !== searchParams.get('page')) {
            const params = new URLSearchParams(searchParams.toString());
            params.set('tab', effectiveTabFromUrl);
            params.set('page', String(pageFromUrl));
            if (params.toString() !== searchParams.toString()) {
                setSearchParams(params, { replace: true });
            }
        }
        setIsInitialUrlParseDone(true);
    }, [searchParams, authLoading, currentUser, currentUserRoles, visibleTabs, setSearchParams]);

    const buildFilterParams = useCallback((tabForBuild: ActiveRentalAppTab): AdminGetRentalApplicationsParams => {
        let params: AdminGetRentalApplicationsParams = {
            p_status_filter: statusFilter.length > 0 ? statusFilter : undefined,
            p_assigned_admin_id_filter: assignedAdminFilter,
            p_property_id_filter: undefined,
            p_applicant_user_id_filter: undefined,
            p_landlord_user_id_filter: undefined,
            p_submitted_at_start: submissionDateStartFilter || undefined,
            p_submitted_at_end: submissionDateEndFilter || undefined,
            p_search_term: undefined,
        };

        const searchTerms = [propertySearchFilter, applicantSearchFilter, landlordSearchFilter].filter(Boolean).join(' ');
        if (searchTerms) params.p_search_term = searchTerms;

        switch (tabForBuild) {
            case 'unassigned':
                params.p_status_filter = ['SUBMITTED'];
                params.p_assigned_admin_id_filter = undefined;
                break;
            case 'myActive':
                params.p_assigned_admin_id_filter = currentUser?.id;
                params.p_status_filter = statusFilter.length > 0 ? statusFilter : [
                    'REVIEW_IN_PROGRESS', 'AWAITING_LANDLORD_CONTACT', 'LANDLORD_INFO_PENDING',
                    'LANDLORD_APPROVED', 'DOCUMENTS_REQUESTED', 'DOCUMENTS_VERIFIED',
                    'APPROVED_AWAITING_PAYMENT', 'PAYMENT_CONFIRMED'
                ];
                break;
            case 'awaitingPayment':
                params.p_status_filter = ['APPROVED_AWAITING_PAYMENT'];
                break;
            case 'readyToFinalize':
                params.p_status_filter = ['PAYMENT_CONFIRMED', 'LEASE_FINALIZED'];
                break;
            case 'closed':
                params.p_status_filter = ['TENANCY_ACTIVE', 'LANDLORD_REJECTED', 'APPLICATION_WITHDRAWN_CUSTOMER', 'CANCELLED_ADMIN'];
                break;
            case 'all':
            default:
                break;
        }
        return params;
    }, [
        currentUser?.id, statusFilter, assignedAdminFilter, propertySearchFilter, applicantSearchFilter, landlordSearchFilter,
        submissionDateStartFilter, submissionDateEndFilter
    ]);

    const fetchApplications = useCallback(async (page: number, tab: ActiveRentalAppTab) => {
        if (authLoading || !currentUser) return;
        setLoading(true);
        setError(null);
        const offset = (page - 1) * itemsPerPage;
        const apiParams = buildFilterParams(tab);
        apiParams.p_offset = offset;
        apiParams.p_limit = itemsPerPage;

        try {
            const { data, error: fetchError } = await api.adminGetRentalApplications(apiParams);
            if (fetchError) throw new Error(typeof fetchError === 'string' ? String(fetchError) : "Failed to fetch rental applications");

            setApplications(data || []);
            setTotalCount(data?.[0]?.total_count ?? (data?.length || 0));
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to fetch rental applications';
            setError(errMsg);
            showErrorNotification("Error Fetching Applications", errMsg);
            setApplications([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    }, [authLoading, currentUser, itemsPerPage, showErrorNotification, buildFilterParams]);

    const fetchStats = useCallback(async () => {
        if (authLoading || !currentUser) return;
        setStatsLoading(true);
        try {
            const { data } = await api.getDashboardStatsAdmin();
            setStats(data);
        } catch (err) {
            console.error("Error fetching dashboard stats:", err);
        } finally {
            setStatsLoading(false);
        }
    }, [authLoading, currentUser]);

    useEffect(() => {
        if (!isInitialUrlParseDone || authLoading || !currentUser) return;
        fetchApplications(currentPage, activeTab);
        fetchStats();
    }, [isInitialUrlParseDone, authLoading, currentUser, currentPage, activeTab, fetchApplications, fetchStats]);

    // Live update when a rental application notification is received
    useRefreshOnNotification('rentalApplications', () => {
        fetchApplications(currentPage, activeTab);
        fetchStats();
    });

    const updateUrlWithCurrentFilters = useCallback((newPage?: number, newTab?: ActiveRentalAppTab) => {
        const params = new URLSearchParams();
        const effectiveTab = newTab || activeTab;
        const pageToSet = newPage || currentPage;

        params.set('tab', effectiveTab);
        params.set('page', String(pageToSet));

        if (statusFilter.length > 0 && effectiveTab === 'all') statusFilter.forEach(s => params.append('status', s));
        if (assignedAdminFilter && effectiveTab === 'all' && isSuperAdmin) params.set('assignedAdmin', assignedAdminFilter);
        if (propertySearchFilter) params.set('propertySearch', propertySearchFilter);
        if (applicantSearchFilter) params.set('applicantSearch', applicantSearchFilter);
        if (landlordSearchFilter) params.set('landlordSearch', landlordSearchFilter);
        if (submissionDateStartFilter) params.set('submissionStart', submissionDateStartFilter);
        if (submissionDateEndFilter) params.set('submissionEnd', submissionDateEndFilter);
        if (moveInDateStartFilter) params.set('moveInStart', moveInDateStartFilter);
        if (moveInDateEndFilter) params.set('moveInEnd', moveInDateEndFilter);

        setSearchParams(params, { replace: true });
    }, [
        activeTab, currentPage, statusFilter, assignedAdminFilter, propertySearchFilter, applicantSearchFilter, landlordSearchFilter,
        submissionDateStartFilter, submissionDateEndFilter, moveInDateStartFilter, moveInDateEndFilter, isSuperAdmin, setSearchParams
    ]);

    const handleTabChange = (newTab: ActiveRentalAppTab) => {
        setActiveTab(newTab);
        setCurrentPage(1);
        setStatusFilter([]);
        if (newTab !== 'all') {
            setAssignedAdminFilter(undefined);
        }
        updateUrlWithCurrentFilters(1, newTab);
    };

    const handleViewDetails = (applicationId: string) => {
        setSelectedApplicationId(applicationId);
        setIsDetailModalOpen(true);
    };

    const handleSelfAssign = async (applicationId: string) => {
        setActionLoadingAppId(applicationId);
        try {
            await api.adminSelfAssignRentalApplication(applicationId);
            showSuccessNotification("Application Assigned", "Successfully assigned to you.");
            fetchApplications(currentPage, activeTab);
        } catch (err) {
            showErrorNotification("Assignment Failed", err instanceof Error ? err.message : "Could not assign application.");
        } finally {
            setActionLoadingAppId(null);
        }
    };

    const handleApplyFilters = () => {
        setCurrentPage(1);
        updateUrlWithCurrentFilters(1, activeTab);
    };

    const handleClearFilters = () => {
        setStatusFilter([]); setAssignedAdminFilter(undefined); setPropertySearchFilter('');
        setApplicantSearchFilter(''); setLandlordSearchFilter(''); setSubmissionDateStartFilter('');
        setSubmissionDateEndFilter(''); setMoveInDateStartFilter(''); setMoveInDateEndFilter('');
        setCurrentPage(1);
        updateUrlWithCurrentFilters(1, activeTab);
    };

    const handleNextPage = () => { if (currentPage < totalPages) updateUrlWithCurrentFilters(currentPage + 1, activeTab); };
    const handlePrevPage = () => { if (currentPage > 1) updateUrlWithCurrentFilters(currentPage - 1, activeTab); };

    const filterSetters = {
        setStatusFilter, setAssignedAdminFilter, setPropertySearchFilter,
        setApplicantSearchFilter, setLandlordSearchFilter, setSubmissionDateStartFilter,
        setSubmissionDateEndFilter, setMoveInDateStartFilter, setMoveInDateEndFilter,
    };
    const currentFilters = {
        statusFilter, assignedAdminFilter, propertySearchFilter, applicantSearchFilter,
        landlordSearchFilter, submissionDateStartFilter, submissionDateEndFilter,
        moveInDateStartFilter, moveInDateEndFilter,
    };

    const totalPages = totalCount > 0 ? Math.ceil(totalCount / itemsPerPage) : 1;
    const companyName = import.meta.env.VITE_COMPANY_NAME || "Admin Panel";

    const renderTabButton = (tabConfig: RentalAppTabConfig) => (
        <button
            key={tabConfig.key}
            onClick={() => handleTabChange(tabConfig.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none whitespace-nowrap flex items-center
                ${activeTab === tabConfig.key
                    ? 'bg-slate-900 text-white shadow-md transform scale-[1.02]'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
        >
            <span className="ml-1">{tabConfig.label}</span>
        </button>
    );

    if (authLoading && !currentUser) {
        return <div className="flex items-center justify-center h-screen bg-gray-50"><LoadingSpinner size={40} /></div>;
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-12">
            <Helmet>
                <title>Rental Applications | {companyName}</title>
            </Helmet>

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl shadow-sm animate-pulse" role="alert">
                        <p className="font-bold">System Error</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Rental Applications</h1>
                        <p className="mt-1 text-sm text-gray-500 font-normal tracking-wide">Manage and track customer rental applications.</p>
                    </div>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md">
                        <div className="p-3 rounded-xl bg-blue-50 text-blue-600 mr-4">
                            <IconClipboardList size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-normal text-gray-400 uppercase tracking-wider">Total Applications</p>
                            <p className="text-xl font-bold text-gray-900 mt-0.5">
                                {loading && totalCount === 0 ? '...' : totalCount}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md">
                        <div className="p-3 rounded-xl bg-amber-50 text-amber-600 mr-4">
                            <IconHourglassHigh size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-normal text-gray-400 uppercase tracking-wider">Pending Review</p>
                            <p className="text-xl font-bold text-gray-900 mt-0.5">
                                {statsLoading ? '...' : (stats as any)?.rental_applications?.submitted || 0}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md">
                        <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 mr-4">
                            <IconCash size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-normal text-gray-400 uppercase tracking-wider">Awaiting Payment</p>
                            <p className="text-xl font-bold text-gray-900 mt-0.5">
                                {statsLoading ? '...' : (stats as any)?.rental_applications?.awaiting_payment || 0}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md">
                        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 mr-4">
                            <IconCircleCheck size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-normal text-gray-400 uppercase tracking-wider">Active Tenancies</p>
                            <p className="text-xl font-bold text-gray-900 mt-0.5">
                                {statsLoading ? '...' : (stats as any)?.rental_applications?.tenancy_active || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-1 bg-gray-200/50 p-1 rounded-xl mb-8 w-fit overflow-x-auto shadow-inner no-scrollbar">
                    {visibleTabs.map(renderTabButton)}
                </div>

                <RentalApplicationFilters
                    filters={currentFilters}
                    setters={filterSetters}
                    onApplyFilters={handleApplyFilters}
                    onClearFilters={handleClearFilters}
                    isSuperAdmin={isSuperAdmin}
                    isDisclosureOpenByDefault={searchParams.toString().length > 0 && !searchParams.get('tab') && !searchParams.get('page')}
                />

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md mb-8">
                    <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-medium text-gray-800">Application List ({visibleTabs.find(t => t.key === activeTab)?.label})</h2>
                            <p className="text-sm text-gray-500 mt-1 font-normal">
                                {loading && totalCount === 0 ? 'Loading applications...' : totalCount > 0
                                    ? `Showing ${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, totalCount)} of ${totalCount} applications`
                                    : 'No applications found for the current filters.'}
                            </p>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Menu as="div" className="relative inline-block text-left">
                                <MenuButton className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors focus:outline-none shadow-sm">
                                    <IconAdjustmentsHorizontal size={18} className="mr-2 text-gray-400" />
                                    Quick View: {statusFilter.length === 0 ? 'All Status' : `${statusFilter.length} Selected`}
                                </MenuButton>
                                <Transition
                                    as={Fragment}
                                    enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100"
                                    leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95"
                                >
                                    <MenuItems className="absolute right-0 mt-2 w-64 origin-top-right bg-white divide-y divide-gray-100 rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                        <div className="px-1 py-1 ">
                                            {[
                                                { value: 'SUBMITTED', label: 'New Submissions' },
                                                { value: 'REVIEW_IN_PROGRESS', label: 'In Review' },
                                                { value: 'APPROVED_AWAITING_PAYMENT', label: 'Awaiting Payment' },
                                                { value: 'PAYMENT_CONFIRMED', label: 'Payment Confirmed' },
                                                { value: 'TENANCY_ACTIVE', label: 'Active Tenancies' }
                                            ].map((status) => (
                                                <MenuItem key={status.value}>
                                                    {({ active }) => (
                                                        <button
                                                            onClick={() => {
                                                                const sValue = status.value as RentalApplicationStatus;
                                                                const newStatus = statusFilter.includes(sValue)
                                                                    ? statusFilter.filter(s => s !== sValue)
                                                                    : [...statusFilter, sValue];
                                                                setStatusFilter(newStatus);
                                                                setCurrentPage(1);
                                                                setTimeout(() => handleApplyFilters(), 0);
                                                            }}
                                                            className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} group flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors`}
                                                        >
                                                            <div className={`flex items-center justify-center w-4 h-4 mr-3 rounded border transition-colors ${statusFilter.includes(status.value as RentalApplicationStatus) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}>
                                                                {statusFilter.includes(status.value as RentalApplicationStatus) && <IconCheck size={12} />}
                                                            </div>
                                                            {status.label}
                                                        </button>
                                                    )}
                                                </MenuItem>
                                            ))}
                                        </div>
                                        <div className="px-1 py-1">
                                            <MenuItem>
                                                {({ active }) => (
                                                    <button
                                                        onClick={() => {
                                                            setStatusFilter([]);
                                                            setCurrentPage(1);
                                                            setTimeout(() => handleApplyFilters(), 0);
                                                        }}
                                                        className={`${active ? 'bg-gray-100 text-red-600' : 'text-red-500'} group flex w-full items-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors`}
                                                    >
                                                        Clear Status Filters
                                                    </button>
                                                )}
                                            </MenuItem>
                                        </div>
                                    </MenuItems>
                                </Transition>
                            </Menu>
                        </div>
                    </div>

                    <RentalApplicationList
                        applications={applications}
                        loading={loading && applications.length === 0}
                        actionLoadingAppId={actionLoadingAppId}
                        onViewDetails={handleViewDetails}
                        onSelfAssign={handleSelfAssign}
                        showSelfAssignButton={activeTab === 'unassigned' && (currentUserRoles.includes('telecalling-owner-team') || currentUserRoles.includes('telecalling-tenant-team'))}
                    />

                    {totalCount > itemsPerPage && (
                        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-b-xl">
                            <div>
                                <p className="text-sm text-gray-700 font-medium">Page <span className="text-blue-600 font-bold">{currentPage}</span> of <span className="font-bold text-gray-900">{totalPages}</span></p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handlePrevPage} disabled={currentPage === 1 || loading} className={getSecondaryButtonClasses()}>
                                    <IconChevronLeft size={16} className="mr-1" /> Previous
                                </button>
                                <button onClick={handleNextPage} disabled={currentPage === totalPages || loading} className={getSecondaryButtonClasses()}>
                                    Next <IconChevronRight size={16} className="ml-1" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {isDetailModalOpen && selectedApplicationId && (
                    <RentalApplicationDetailModal
                        isOpen={isDetailModalOpen}
                        onClose={() => { setIsDetailModalOpen(false); setSelectedApplicationId(null); }}
                        applicationId={selectedApplicationId}
                        onSuccess={() => fetchApplications(currentPage, activeTab)}
                    />
                )}
            </div>
        </div>
    );
}

export default RentalApplicationsPage;