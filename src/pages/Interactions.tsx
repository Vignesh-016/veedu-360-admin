import { useEffect, useState, useCallback, useMemo, Fragment } from 'react';
import { Helmet } from 'react-helmet-async';
import { Menu, Transition, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { useSearchParams } from 'react-router-dom';
import {
    IconChevronLeft, IconChevronRight, IconMessage2, IconClipboardCheck, IconCalendarTime, IconCircleCheck,
    IconAdjustmentsHorizontal, IconCheck
} from '@tabler/icons-react';

import api from '../lib/supabaseClient';
import {
    CustomerInteractionAdminView, GetAllCustomerInteractionsAdminParams,
    InteractionStatus, DashboardStats
} from '../lib/types';
import InteractionEditModal from '../components/InteractionEditModal';
import { useNotification } from '../components/NotificationProvider';
import { useAuth } from '../lib/AuthContext';
import { useRefreshOnNotification } from '../lib/RealtimeNotificationContext';
import { getSecondaryButtonClasses } from '../lib/twUtils';
import InteractionFilters from '../components/interactions/InteractionFilters';
import InteractionList from '../components/interactions/InteractionList';
import LoadingSpinner from '../components/LoadingSpinner';
import interactionWorkflowTabs, { ActiveInteractionTab, getDefaultInteractionTab, InteractionTabConfig } from '../components/interactions/WorkflowTabConfig';

function Interactions() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { user: currentUser, roles: currentUserRoles, isSuperAdmin, loading: authLoading } = useAuth();
    const { showSuccessNotification, showErrorNotification } = useNotification();

    // --- Component State ---
    const [interactions, setInteractions] = useState<CustomerInteractionAdminView[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoadingInteractionId, setActionLoadingInteractionId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInteraction, setSelectedInteraction] = useState<CustomerInteractionAdminView | null>(null);
    const [itemsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [isInitialUrlParseDone, setIsInitialUrlParseDone] = useState(false);

    // --- Local State for Filters, Page, Tab ---
    const [activeTab, setActiveTab] = useState<ActiveInteractionTab>('all');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [propertyIdFilter, setPropertyIdFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<InteractionStatus[]>([]);
    const [userIdFilter, setUserIdFilter] = useState<string>('');
    const [scheduledForStartFilter, setScheduledForStartFilter] = useState<string>('');
    const [scheduledForEndFilter, setScheduledForEndFilter] = useState<string>('');
    const [propertySearchFilter, setPropertySearchFilter] = useState<string>('');
    const [customerSearchFilter, setCustomerSearchFilter] = useState<string>('');
    const [assignedTTFilter, setAssignedTTFilter] = useState<string>('');
    const [assignedSalesFilter, setAssignedSalesFilter] = useState<string>('');

    const isTelecallingTenantTeam = currentUserRoles.includes('telecalling-tenant-team');

    const visibleTabs = useMemo(() => interactionWorkflowTabs.filter(tab =>
        tab.allowedRoles.some(role => currentUserRoles.includes(role))
    ), [currentUserRoles]);


    // Effect 1: Sync URL searchParams to local state & set default tab
    useEffect(() => {
        if (authLoading || !currentUser || !visibleTabs.length) return;

        const pageFromUrl = Number(searchParams.get('page')) || 1;
        const tabFromUrlParams = searchParams.get('tab') as ActiveInteractionTab | null;
        const defaultTab = getDefaultInteractionTab(currentUserRoles, visibleTabs);
        const effectiveTabFromUrl = tabFromUrlParams && visibleTabs.find(vt => vt.key === tabFromUrlParams) ? tabFromUrlParams : defaultTab;

        setCurrentPage(pageFromUrl);
        setActiveTab(effectiveTabFromUrl);
        setPropertyIdFilter(searchParams.get('propertyId') || '');
        // Status filter is not persisted in URL, so it keeps its local state or default (empty array)
        setUserIdFilter(searchParams.get('userId') || '');
        setScheduledForStartFilter(searchParams.get('scheduledStart') || '');
        setScheduledForEndFilter(searchParams.get('scheduledEnd') || '');
        setPropertySearchFilter(searchParams.get('propertySearch') || '');
        setCustomerSearchFilter(searchParams.get('customerSearch') || '');
        setAssignedTTFilter(searchParams.get('assignedTT') || '');
        setAssignedSalesFilter(searchParams.get('assignedSales') || '');

        if (tabFromUrlParams !== effectiveTabFromUrl || String(pageFromUrl) !== searchParams.get('page')) {
            const params = new URLSearchParams(searchParams.toString());
            params.set('tab', effectiveTabFromUrl);
            params.set('page', String(pageFromUrl));
            // Only update URL if it's different from what we derived to avoid loops
            if (params.toString() !== searchParams.toString()) {
                setSearchParams(params, { replace: true });
            }
        }
        setIsInitialUrlParseDone(true);
    }, [searchParams, authLoading, currentUser, currentUserRoles, visibleTabs, setSearchParams]);


    const buildFilterParams = useCallback((
        tabForBuild: ActiveInteractionTab,
        currentStatusFilter: InteractionStatus[],
        currentPropertyIdFilter: string,
        currentUserIdFilter: string,
        currentScheduledForStartFilter: string,
        currentScheduledForEndFilter: string,
        currentPropertySearchFilter: string,
        currentCustomerSearchFilter: string,
        currentAssignedTTFilter: string,
        currentAssignedSalesFilter: string
    ): GetAllCustomerInteractionsAdminParams => {
        const baseParams: GetAllCustomerInteractionsAdminParams = {
            p_property_id_filter: currentPropertyIdFilter || undefined,
            p_customer_user_id_filter: currentUserIdFilter || undefined,
            p_scheduled_for_start: currentScheduledForStartFilter || undefined,
            p_scheduled_for_end: currentScheduledForEndFilter || undefined,
            p_property_search: currentPropertySearchFilter || undefined,
            p_customer_search: currentCustomerSearchFilter || undefined,
            p_assigned_tt_admin_id_filter: (tabForBuild === 'all' && isSuperAdmin) ? (currentAssignedTTFilter || undefined) : undefined,
            p_assigned_sales_admin_id_filter: (tabForBuild === 'all' && isSuperAdmin) ? (currentAssignedSalesFilter || undefined) : undefined,
        };

        let effectiveStatusFilter = currentStatusFilter.length > 0 ? currentStatusFilter : undefined;

        if (tabForBuild === 'assignableToMe') {
            effectiveStatusFilter = ['VISIT_PENDING'];
            // Backend will filter for unassigned to TT
        } else if (tabForBuild === 'myAssigned') {
            effectiveStatusFilter = currentStatusFilter.length > 0 ? currentStatusFilter : ['VISIT_PENDING', 'VISIT_CONFIRMED_PENDING_SALES', "VISIT_SCHEDULED_WITH_SALES", "VISIT_CANCELLED", "VISIT_COMPLETED"];
            baseParams.p_assigned_tt_admin_id_filter = currentUser?.id;
        }
        baseParams.p_interaction_statuses = effectiveStatusFilter;
        return baseParams;
    }, [currentUser?.id, isSuperAdmin]);


    const fetchInteractions = useCallback(async (pageToFetch: number, tabForFetch: ActiveInteractionTab) => {
        if (authLoading || !currentUser) return;
        setLoading(true);
        setError(null);
        const offset = (pageToFetch - 1) * itemsPerPage;

        const apiParams = buildFilterParams(
            tabForFetch, statusFilter, propertyIdFilter, userIdFilter, scheduledForStartFilter,
            scheduledForEndFilter, propertySearchFilter, customerSearchFilter,
            assignedTTFilter, assignedSalesFilter
        );
        apiParams.p_offset = offset;
        apiParams.p_limit = itemsPerPage;

        try {
            const { data, error: fetchError } = await api.getAllCustomerInteractionsAdmin(apiParams);
            if (fetchError) throw new Error(typeof fetchError === 'string' ? fetchError : fetchError.message);

            setInteractions(data || []);
            setTotalCount(data?.[0]?.total_count ?? (data?.length || 0));
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to fetch interactions';
            setError(errMsg); showErrorNotification("Error Fetching Interactions", errMsg);
            setInteractions([]); setTotalCount(0);
        } finally {
            setLoading(false);
        }
    }, [
        authLoading, currentUser, itemsPerPage, showErrorNotification, buildFilterParams,
        statusFilter, propertyIdFilter, userIdFilter, scheduledForStartFilter, scheduledForEndFilter,
        propertySearchFilter, customerSearchFilter, assignedTTFilter, assignedSalesFilter
    ]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const { data, error } = await api.getDashboardStatsAdmin();
            if (error) throw error;
            setStats(data);
        } catch (err) {
            console.error("Error fetching interaction stats:", err);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    // Effect 2: Fetch data when relevant local state changes
    useEffect(() => {
        if (!isInitialUrlParseDone || authLoading || !currentUser) return;
        fetchInteractions(currentPage, activeTab);
        fetchStats();
    }, [
        isInitialUrlParseDone, authLoading, currentUser, currentPage, activeTab, fetchInteractions, fetchStats
        // Note: Individual filter states are dependencies of fetchInteractions via buildFilterParams
    ]);

    // Live update when an interaction notification is received
    useRefreshOnNotification('interactions', () => {
        fetchInteractions(currentPage, activeTab);
        fetchStats();
    });


    const updateUrlFilters = useCallback((newPage?: number, newTab?: ActiveInteractionTab) => {
        const params = new URLSearchParams();
        const effectiveTab = newTab || activeTab;
        const pageToSet = newPage || currentPage;

        params.set('tab', effectiveTab);
        params.set('page', String(pageToSet));
        if (propertyIdFilter) params.set('propertyId', propertyIdFilter);
        if (userIdFilter) params.set('userId', userIdFilter);
        if (scheduledForStartFilter) params.set('scheduledStart', scheduledForStartFilter);
        if (scheduledForEndFilter) params.set('scheduledEnd', scheduledForEndFilter);
        if (propertySearchFilter) params.set('propertySearch', propertySearchFilter);
        if (customerSearchFilter) params.set('customerSearch', customerSearchFilter);
        if (effectiveTab === 'all' && isSuperAdmin) { // Only persist admin filters for 'all' tab if superadmin
            if (assignedTTFilter) params.set('assignedTT', assignedTTFilter);
            if (assignedSalesFilter) params.set('assignedSales', assignedSalesFilter);
        }
        setSearchParams(params, { replace: true });
    }, [
        activeTab, currentPage, propertyIdFilter, userIdFilter, scheduledForStartFilter,
        scheduledForEndFilter, propertySearchFilter, customerSearchFilter,
        assignedTTFilter, assignedSalesFilter, isSuperAdmin, setSearchParams
    ]);

    const handleTabChange = (newTab: ActiveInteractionTab) => {
        setLoading(true);
        setActiveTab(newTab);
        setCurrentPage(1);
        // Clear filters that might not be relevant to the new tab or reset to defaults
        if (newTab !== 'all') {
            setAssignedTTFilter('');
            setAssignedSalesFilter('');
        }
        setStatusFilter([]); // Reset status filter on tab change for simplicity
        updateUrlFilters(1, newTab);
    };

    const handleEditInteraction = (interaction: CustomerInteractionAdminView) => {
        setSelectedInteraction(interaction);
        setIsModalOpen(true);
    };
    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedInteraction(null);
    };

    const handleApplyFilters = () => { setCurrentPage(1); updateUrlFilters(1, activeTab); };
    const handleClearFilters = () => {
        setPropertyIdFilter(''); setStatusFilter([]); setUserIdFilter('');
        setScheduledForStartFilter(''); setScheduledForEndFilter('');
        setPropertySearchFilter(''); setCustomerSearchFilter('');
        setAssignedTTFilter(''); setAssignedSalesFilter('');
        setCurrentPage(1);
        updateUrlFilters(1, activeTab);
    };

    const handleNextPage = () => { const newPage = currentPage + 1; updateUrlFilters(newPage, activeTab); };
    const handlePrevPage = () => { const newPage = Math.max(currentPage - 1, 1); updateUrlFilters(newPage, activeTab); };

    const handleSelfAssignInteraction = async (interactionId: string) => {
        setActionLoadingInteractionId(interactionId);
        try {
            const { error: assignError } = await api.selfAssignInteractionForTenantContact(interactionId);
            if (assignError) throw assignError;
            showSuccessNotification("Interaction Assigned", "Successfully assigned to you.");
            fetchInteractions(currentPage, activeTab);
        } catch (err) {
            showErrorNotification("Assignment Failed", err instanceof Error ? err.message : "Could not assign interaction.");
        } finally {
            setActionLoadingInteractionId(null);
        }
    };

    const handleMarkTenantVerified = async (interactionId: string) => {
        setActionLoadingInteractionId(interactionId);
        try {
            const { error: verifyError } = await api.markInteractionTenantVerified({ p_interaction_id: interactionId });
            if (verifyError) throw verifyError;
            showSuccessNotification("Interaction Verified", "Marked as tenant verified. Status updated.");
            fetchInteractions(currentPage, activeTab);
        } catch (err) {
            showErrorNotification("Verification Failed", err instanceof Error ? err.message : "Could not mark as verified.");
        } finally {
            setActionLoadingInteractionId(null);
        }
    };

    const handleUnassignTenantTelecaller = async (interactionId: string) => {
        if (!window.confirm("Are you sure you want to unassign the Tenant Telecaller from this interaction?")) return;
        setActionLoadingInteractionId(interactionId);
        try {
            await api.unassignInteractionFromTenantTelecaller(interactionId);
            showSuccessNotification("TT Unassigned", "Tenant Telecaller unassigned successfully.");
            fetchInteractions(currentPage, activeTab);
        } catch (err) {
            showErrorNotification("Unassignment Failed", err instanceof Error ? err.message : "Could not unassign Tenant Telecaller.");
        } finally {
            setActionLoadingInteractionId(null);
        }
    };

    const filterSetters = {
        setPropertyIdFilter, setStatusFilter, setUserIdFilter,
        setScheduledForStartFilter, setScheduledForEndFilter,
        setPropertySearchFilter, setCustomerSearchFilter,
        setAssignedTTFilter, setAssignedSalesFilter,
    };

    const currentFilters = {
        propertyIdFilter, statusFilter, userIdFilter,
        scheduledForStartFilter, scheduledForEndFilter,
        propertySearchFilter, customerSearchFilter,
        assignedTTFilter, assignedSalesFilter,
    };

    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const companyName = import.meta.env.VITE_COMPANY_NAME;

    const renderTabButton = (tabConfig: InteractionTabConfig) => (
        <button
            key={tabConfig.key}
            onClick={() => handleTabChange(tabConfig.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none whitespace-nowrap flex items-center
                ${activeTab === tabConfig.key
                    ? 'bg-slate-900 text-white shadow-md transform scale-[1.02]'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
            disabled={loading}
        >
            <span className={`${activeTab === tabConfig.key ? 'text-white' : 'text-gray-400'}`}>
                {tabConfig.icon}
            </span>
            <span className="ml-2">{tabConfig.label}</span>
        </button>
    );

    if (authLoading && !currentUser) {
        return <div className="flex items-center justify-center h-screen"><LoadingSpinner size={40} /></div>;
    }
    if (!isInitialUrlParseDone && !authLoading && currentUser) {
        return <div className="flex items-center justify-center h-screen"><LoadingSpinner size={40} /></div>;
    }

    return (
        <>
            <Helmet><title>{`Interactions | ${companyName}`}</title></Helmet>
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    {error && (<div className="mb-6 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-md shadow" role="alert"> <p className="font-bold">Error</p> <p>{error}</p> </div>)}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Customer Interactions</h1>
                            <p className="mt-1 text-sm text-gray-500 font-normal">Manage customer interactions and property visits.</p>
                        </div>
                    </div>

                    {/* Summary Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md">
                            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 mr-4">
                                <IconMessage2 size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-normal text-gray-400 uppercase tracking-wider">Total Interactions</p>
                                <p className="text-xl font-bold text-gray-900 mt-0.5">
                                    {statsLoading ? '...' : stats?.interactions?.total_interactions || 0}
                                </p>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md">
                            <div className="p-3 rounded-xl bg-amber-50 text-amber-600 mr-4">
                                <IconClipboardCheck size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-normal text-gray-400 uppercase tracking-wider">Pending Verification</p>
                                <p className="text-xl font-bold text-gray-900 mt-0.5">
                                    {statsLoading ? '...' : (stats?.interactions?.interactions_by_status as any)?.['VISIT_PENDING'] || 0}
                                </p>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md">
                            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 mr-4">
                                <IconCalendarTime size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-normal text-gray-400 uppercase tracking-wider">Scheduled Visits</p>
                                <p className="text-xl font-bold text-gray-900 mt-0.5">
                                    {statsLoading ? '...' : (
                                        ((stats?.interactions?.interactions_by_status as any)?.['VISIT_CONFIRMED_PENDING_SALES'] || 0) +
                                        ((stats?.interactions?.interactions_by_status as any)?.['VISIT_SCHEDULED_WITH_SALES'] || 0)
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md">
                            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 mr-4">
                                <IconCircleCheck size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-normal text-gray-400 uppercase tracking-wider">Completed Visits</p>
                                <p className="text-xl font-bold text-gray-900 mt-0.5">
                                    {statsLoading ? '...' : (stats?.interactions?.interactions_by_status as any)?.['VISIT_COMPLETED'] || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-8 flex space-x-2 bg-gray-100/50 p-1.5 rounded-xl w-fit overflow-x-auto border border-gray-100">
                        {visibleTabs.map(renderTabButton)}
                    </div>

                    <InteractionFilters
                        filters={currentFilters}
                        setters={filterSetters}
                        onApplyFilters={handleApplyFilters}
                        onClearFilters={handleClearFilters}
                        isSuperAdmin={isSuperAdmin}
                        isDisclosureOpenByDefault={searchParams.toString().length > 0 && !searchParams.get('tab') && !searchParams.get('page')}
                    />

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
                        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-medium text-gray-800">Interaction List ({visibleTabs.find(t => t.key === activeTab)?.label})</h2>
                                <p className="text-sm text-gray-500 mt-1 font-normal">
                                    {loading && totalCount === 0 ? 'Loading interactions...' : totalCount > 0
                                        ? `Showing ${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, totalCount)} of ${totalCount} interactions`
                                        : 'No interactions found matching your criteria.'
                                    }
                                </p>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Menu as="div" className="relative inline-block text-left">
                                    <MenuButton className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors focus:outline-none shadow-sm">
                                        <IconAdjustmentsHorizontal size={18} className="mr-2 text-gray-400" />
                                        Quick View: {statusFilter.length === 0 ? 'All Status' : `${statusFilter.length} Selected`}
                                    </MenuButton>
                                    <Transition
                                        as={Fragment}
                                        enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100"
                                        leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95"
                                    >
                                        <MenuItems className="absolute right-0 mt-2 w-56 origin-top-right bg-white divide-y divide-gray-100 rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                            <div className="px-1 py-1 ">
                                                {[
                                                    { value: 'VISIT_PENDING', label: 'Pending Verification' },
                                                    { value: 'VISIT_CONFIRMED_PENDING_SALES', label: 'Confirmed (Pending Sales)' },
                                                    { value: 'VISIT_SCHEDULED_WITH_SALES', label: 'Scheduled with Sales' },
                                                    { value: 'VISIT_COMPLETED', label: 'Completed' },
                                                    { value: 'VISIT_CANCELLED', label: 'Cancelled' },
                                                    { value: 'WISHLISTED', label: 'Wishlisted' }
                                                ].map((status) => (
                                                    <MenuItem key={status.value}>
                                                        {({ active }) => (
                                                            <button
                                                                onClick={() => {
                                                                    const sValue = status.value as InteractionStatus;
                                                                    const newStatus = statusFilter.includes(sValue)
                                                                        ? statusFilter.filter(s => s !== sValue)
                                                                        : [...statusFilter, sValue];
                                                                    setStatusFilter(newStatus);
                                                                    setCurrentPage(1);
                                                                    // We need to wait for state update or use a timeout/effect, but here we can just let handleApplyFilters handle it or manually trigger updateUrl
                                                                    setTimeout(() => handleApplyFilters(), 0);
                                                                }}
                                                                className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} group flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors`}
                                                            >
                                                                <div className={`flex items-center justify-center w-4 h-4 mr-3 rounded border transition-colors ${statusFilter.includes(status.value as InteractionStatus) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}>
                                                                    {statusFilter.includes(status.value as InteractionStatus) && <IconCheck size={12} />}
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
                        <div className="overflow-x-auto">
                            <InteractionList
                                interactions={interactions}
                                loading={loading && interactions.length === 0}
                                actionLoadingInteractionId={actionLoadingInteractionId}
                                onEditInteraction={handleEditInteraction}
                                showSelfAssignButton={activeTab === 'assignableToMe' && (isTelecallingTenantTeam || isSuperAdmin)}
                                onSelfAssign={handleSelfAssignInteraction}
                                showMarkVerifiedButton={activeTab === 'myAssigned' && (isTelecallingTenantTeam || isSuperAdmin)}
                                onUnassignTenantTelecaller={handleUnassignTenantTelecaller}
                                showUnassignTTButton={
                                    (activeTab === 'myAssigned' && isTelecallingTenantTeam) || isSuperAdmin
                                }
                                onMarkVerified={handleMarkTenantVerified}
                                currentUserId={currentUser?.id}
                            />
                        </div>
                        {totalCount > itemsPerPage && (
                            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-b-xl">
                                <div><p className="text-sm text-gray-700">Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span></p></div>
                                <div className="flex gap-2">
                                    <button onClick={handlePrevPage} disabled={currentPage === 1 || loading} className={getSecondaryButtonClasses()}><IconChevronLeft size={16} className="mr-1" /> Previous</button>
                                    <button onClick={handleNextPage} disabled={currentPage === totalPages || loading} className={getSecondaryButtonClasses()}>Next <IconChevronRight size={16} className="ml-1" /></button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <InteractionEditModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                interaction={selectedInteraction}
                onSuccess={() => fetchInteractions(currentPage, activeTab)}
            />
        </>
    );
}

export default Interactions;