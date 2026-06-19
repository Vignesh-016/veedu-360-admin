import { useEffect, useState, useCallback, useMemo, Fragment } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import {
    IconChevronLeft, IconChevronRight, IconTicket, IconUrgent,
    IconClock, IconChevronDown, IconFilter, IconPlus,
    IconCheck
} from '@tabler/icons-react';
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react';

import TicketFormModal from '../components/TicketFormModal';
import api from '../lib/supabaseClient';
import {
    TicketAdminSummary, TicketStatus, TicketPriority, TicketAdminDetails,
    TicketCategory, ListTicketsAdminParams, AdminRole
} from '../lib/types';
import { useNotification } from '../components/NotificationProvider';
import { useAuth } from '../lib/AuthContext';
import { useRefreshOnNotification } from '../lib/RealtimeNotificationContext';
import TicketFilters from '../components/tickets/TicketFilters';
import TicketList from '../components/tickets/TicketList';
import LoadingSpinner from '../components/LoadingSpinner';
import ticketWorkflowTabs, { ActiveTicketTab, TicketTabConfig } from '../components/tickets/WorkflowTabConfig';

function getDefaultTicketTab(userRoles: AdminRole[], availableTabs: TicketTabConfig[]): ActiveTicketTab {
    let defaultTabKey: ActiveTicketTab = 'all';
    for (const role of userRoles) {
        const foundDefault = availableTabs.find(tab => tab.defaultForRoles?.includes(role));
        if (foundDefault) {
            defaultTabKey = foundDefault.key;
            break;
        }
    }
    if (!availableTabs.find(vt => vt.key === defaultTabKey)) {
        defaultTabKey = availableTabs[0]?.key || 'all';
    }
    return defaultTabKey;
}

function TicketsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { user: currentUser, roles: currentUserRoles, loading: authLoading } = useAuth();
    const { showSuccessNotification, showErrorNotification } = useNotification();

    // --- Component State ---
    const [tickets, setTickets] = useState<TicketAdminSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [detailsLoadingTicketId, setDetailsLoadingTicketId] = useState<number | null>(null);
    const [actionLoadingTicketId, setActionLoadingTicketId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedTicketDetails, setSelectedTicketDetails] = useState<TicketAdminDetails | null>(null);
    const [itemsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [isInitialUrlParseDone, setIsInitialUrlParseDone] = useState(false);

    // --- Local State for Filters, Page, Tab ---
    const [activeTab, setActiveTab] = useState<ActiveTicketTab>('all');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [statusFilter, setStatusFilter] = useState<TicketStatus | undefined>(undefined);
    const [priorityFilter, setPriorityFilter] = useState<TicketPriority | undefined>(undefined);
    const [categoryFilter, setCategoryFilter] = useState<TicketCategory | undefined>(undefined);
    const [customerFilter, setCustomerFilter] = useState<string | undefined>(undefined);
    const [vendorFilter, setVendorFilter] = useState<string | undefined>(undefined);
    const [assignedAdminFilter, setAssignedAdminFilter] = useState<string | undefined>(undefined);
    const [searchTermFilter, setSearchTermFilter] = useState<string>('');

    const canSelfAssignTickets = currentUserRoles.includes('telecalling-owner-team') || currentUserRoles.includes('telecalling-tenant-team');

    const visibleTabs = useMemo(() => ticketWorkflowTabs.filter(tab =>
        tab.allowedRoles.some(role => currentUserRoles.includes(role))
    ), [currentUserRoles]);

    // Metric calculations Based on current visible tickets (Note: In production this should be a backend rpc)
    const metrics = useMemo(() => {
        const total = totalCount;
        const open = tickets.filter(t => t.status === 'OPEN' || t.status === 'NEW').length;
        const highPriority = tickets.filter(t => t.priority === 'HIGH').length;
        const myActive = tickets.filter(t => t.assigned_support_admin_id === currentUser?.id).length;

        return {
            total,
            open: total > 0 ? Math.round((open / Math.max(tickets.length, 1)) * total) : 0,
            highPriority: total > 0 ? Math.round((highPriority / Math.max(tickets.length, 1)) * total) : 0,
            myActive: total > 0 ? Math.round((myActive / Math.max(tickets.length, 1)) * total) : 0,
        };
    }, [tickets, totalCount, currentUser?.id]);

    // Effect 1: Sync URL searchParams to local state & set default tab
    useEffect(() => {
        if (authLoading || !currentUser || !visibleTabs.length) return;

        const pageFromUrl = Number(searchParams.get('page')) || 1;
        const tabFromUrlParams = searchParams.get('tab') as ActiveTicketTab | null;
        const defaultTab = getDefaultTicketTab(currentUserRoles, visibleTabs);
        const effectiveTabFromUrl = tabFromUrlParams && visibleTabs.find(vt => vt.key === tabFromUrlParams) ? tabFromUrlParams : defaultTab;

        setCurrentPage(pageFromUrl);
        setActiveTab(effectiveTabFromUrl);
        setStatusFilter(searchParams.get('status') as TicketStatus || undefined);
        setPriorityFilter(searchParams.get('priority') as TicketPriority || undefined);
        setCategoryFilter(searchParams.get('category') as TicketCategory || undefined);
        setCustomerFilter(searchParams.get('customer') || undefined);
        setVendorFilter(searchParams.get('vendor') || undefined);
        setAssignedAdminFilter(searchParams.get('assignedAdmin') || undefined);
        setSearchTermFilter(searchParams.get('search') || '');

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

    const buildFilterParams = useCallback((
        tabForBuild: ActiveTicketTab,
        currentStatusFilter: TicketStatus | undefined,
        currentPriorityFilter: TicketPriority | undefined,
        currentCategoryFilter: TicketCategory | undefined,
        currentCustomerFilter: string | undefined,
        currentVendorFilter: string | undefined,
        currentAssignedAdminFilter: string | undefined,
        currentSearchTermFilter: string
    ): ListTicketsAdminParams => {
        const baseParams: ListTicketsAdminParams = {
            p_priority_filter: currentPriorityFilter ? [currentPriorityFilter] : undefined,
            p_category_filter: currentCategoryFilter ? [currentCategoryFilter] : undefined,
            p_raised_by_user_id_filter: currentCustomerFilter || undefined,
            p_search_term: currentSearchTermFilter || undefined,
        };
        let effectiveStatusFilter: TicketStatus[] | undefined = currentStatusFilter ? [currentStatusFilter] : undefined;

        switch (tabForBuild) {
            case 'unassigned':
                effectiveStatusFilter = ['NEW', 'OPEN'];
                baseParams.p_assigned_support_admin_id_filter = undefined;
                baseParams.p_assigned_to_vendor_id_filter = undefined;
                break;
            case 'myTickets':
                if (!currentStatusFilter) effectiveStatusFilter = ['NEW', 'OPEN', 'ASSIGNED', 'WAITING_TENANT_RESPONSE', 'WAITING_OWNER_RESPONSE', 'IN_PROGRESS'];
                baseParams.p_assigned_support_admin_id_filter = currentUser?.id;
                break;
            case 'allOpenInProgress':
                if (!currentStatusFilter) effectiveStatusFilter = ['NEW', 'OPEN', 'ASSIGNED', 'WAITING_TENANT_RESPONSE', 'WAITING_OWNER_RESPONSE', 'IN_PROGRESS'];
                baseParams.p_assigned_support_admin_id_filter = currentAssignedAdminFilter || undefined;
                baseParams.p_assigned_to_vendor_id_filter = currentVendorFilter || undefined;
                break;
            case 'all':
                baseParams.p_assigned_support_admin_id_filter = currentAssignedAdminFilter || undefined;
                baseParams.p_assigned_to_vendor_id_filter = currentVendorFilter || undefined;
                break;
        }
        baseParams.p_status_filter = effectiveStatusFilter;
        return baseParams;
    }, [currentUser?.id]);

    const fetchTickets = useCallback(async (pageToFetch: number, tabForFetch: ActiveTicketTab) => {
        if (authLoading || !currentUser) return;
        setLoading(true); setError(null);
        const offset = (pageToFetch - 1) * itemsPerPage;

        const apiParams = buildFilterParams(
            tabForFetch, statusFilter, priorityFilter, categoryFilter,
            customerFilter, vendorFilter, assignedAdminFilter, searchTermFilter
        );
        apiParams.p_offset = offset;
        apiParams.p_limit = itemsPerPage;

        try {
            const { data, error: fetchError } = await api.listTicketsAdmin(apiParams);
            if (fetchError) throw new Error(typeof fetchError === 'string' ? String(fetchError || "Unknown fetch error") : "Unknown fetch error");
            setTickets(data || []);
            setTotalCount(data?.[0]?.total_count ?? (data?.length || 0));
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to fetch tickets';
            setError(errMsg); showErrorNotification("Error Fetching Tickets", errMsg);
            setTickets([]); setTotalCount(0);
        } finally { setLoading(false); }
    }, [
        authLoading, currentUser, itemsPerPage, showErrorNotification, buildFilterParams,
        statusFilter, priorityFilter, categoryFilter, customerFilter, vendorFilter,
        assignedAdminFilter, searchTermFilter
    ]);

    // Effect 2: Fetch data when relevant local state changes
    useEffect(() => {
        if (!isInitialUrlParseDone || authLoading || !currentUser) return;
        fetchTickets(currentPage, activeTab);
    }, [
        isInitialUrlParseDone, authLoading, currentUser, currentPage, activeTab, fetchTickets
    ]);

    // Live update the list when a new ticket notification is received
    useRefreshOnNotification('tickets', () => {
        fetchTickets(currentPage, activeTab);
    });

    const updateUrlFilters = useCallback((newPage?: number, newTab?: ActiveTicketTab) => {
        const params = new URLSearchParams();
        const effectiveTab = newTab || activeTab;
        const pageToSet = newPage || currentPage;

        params.set('tab', effectiveTab);
        params.set('page', String(pageToSet));
        if (statusFilter) params.set('status', statusFilter);
        if (priorityFilter) params.set('priority', priorityFilter);
        if (categoryFilter) params.set('category', categoryFilter);
        if (customerFilter) params.set('customer', customerFilter);
        if (searchTermFilter) params.set('search', searchTermFilter);

        if (effectiveTab === 'all' || effectiveTab === 'allOpenInProgress') {
            if (vendorFilter) params.set('vendor', vendorFilter);
            if (assignedAdminFilter) params.set('assignedAdmin', assignedAdminFilter);
        }
        setSearchParams(params, { replace: true });
    }, [
        activeTab, currentPage, statusFilter, priorityFilter, categoryFilter,
        customerFilter, vendorFilter, assignedAdminFilter, searchTermFilter, setSearchParams
    ]);


    const handleViewEditTicket = async (ticketId: number) => {
        setDetailsLoadingTicketId(ticketId); setSelectedTicketDetails(null); setError(null);
        try {
            const { data: detailsData, error: detailsError } = await api.getTicketDetailsAdmin(ticketId);
            if (detailsError) throw detailsError;
            if (!detailsData) throw new Error('Ticket details not found.');
            setSelectedTicketDetails(detailsData); setIsFormModalOpen(true);
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to load ticket details.';
            setError(errMsg); showErrorNotification("Error Loading Details", errMsg);
        } finally { setDetailsLoadingTicketId(null); }
    };

    const handleFormModalClose = () => { setIsFormModalOpen(false); setSelectedTicketDetails(null); };

    const handleApplyFilters = () => { setCurrentPage(1); updateUrlFilters(1, activeTab); };
    const handleClearFilters = () => {
        setStatusFilter(undefined); setPriorityFilter(undefined); setCategoryFilter(undefined);
        setCustomerFilter(undefined); setVendorFilter(undefined); setAssignedAdminFilter(undefined);
        setSearchTermFilter(''); setCurrentPage(1);
        updateUrlFilters(1, activeTab);
    };

    const handleNextPage = () => { const newPage = currentPage + 1; updateUrlFilters(newPage, activeTab); };
    const handlePrevPage = () => { const newPage = Math.max(currentPage - 1, 1); updateUrlFilters(newPage, activeTab); };

    const handleSelfAssignTicket = async (ticketId: number) => {
        setActionLoadingTicketId(ticketId);
        try {
            const { error: assignError } = await api.assignTicketToSelfTelecaller(ticketId);
            if (assignError) throw new Error(typeof assignError === 'string' ? assignError : String(assignError.message || assignError.details || "Unknown assignment error"));
            showSuccessNotification("Ticket Assigned", `Ticket #${ticketId} assigned to you successfully.`);
            fetchTickets(currentPage, activeTab);
        } catch (err) {
            showErrorNotification("Assignment Failed", err instanceof Error ? err.message : "Could not assign ticket.");
        } finally { setActionLoadingTicketId(null); }
    };

    const filterSetters = {
        setStatusFilter, setPriorityFilter, setCategoryFilter, setCustomerFilter,
        setVendorFilter, setAssignedAdminFilter, setSearchTermFilter,
    };
    const currentFilters = {
        statusFilter, priorityFilter, categoryFilter, customerFilter,
        vendorFilter, assignedAdminFilter, searchTermFilter,
    };

    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const companyName = import.meta.env.VITE_COMPANY_NAME;

    if (authLoading && !currentUser) {
        return <div className="flex items-center justify-center h-screen bg-slate-50"><LoadingSpinner size={40} /></div>;
    }
    if (!isInitialUrlParseDone && !authLoading && currentUser) {
        return <div className="flex items-center justify-center h-screen bg-slate-50"><LoadingSpinner size={40} /></div>;
    }

    return (
        <div className="min-h-screen bg-[#fcfcfd] pb-12">
            <Helmet><title>{`Support Center | ${companyName}`}</title></Helmet>

            {/* Premium Header */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center space-x-3 mb-1">
                                <div className="p-2 bg-slate-900 rounded-lg text-white">
                                    <IconTicket size={24} />
                                </div>
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Support Tickets</h1>
                            </div>
                            <p className="text-slate-500 font-normal ml-12">System-wide monitoring & technical resolution desk</p>
                        </div>
                        <button
                            onClick={() => { setSelectedTicketDetails(null); setIsFormModalOpen(true); }}
                            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-slate-200 hover:shadow-xl hover:bg-slate-800 transition-all flex items-center group scale-100 hover:scale-[1.02] active:scale-95"
                        >
                            <IconPlus size={18} className="mr-2 group-hover:rotate-90 transition-transform duration-300" />
                            Initialize Ticket
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="mb-8 bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-2xl shadow-sm flex items-start animate-fadeIn">
                        <div className="bg-rose-100 p-1.5 rounded-lg mr-3 mt-0.5">
                            <IconUrgent size={18} className="text-rose-600" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">System Conflict Detected</p>
                            <p className="text-sm opacity-90 mt-0.5 font-medium">{error}</p>
                        </div>
                    </div>
                )}

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md">
                        <div className="p-3.5 rounded-2xl bg-slate-900 text-white mr-4 shadow-lg shadow-slate-100">
                            <IconTicket size={26} />
                        </div>
                        <div>
                            <p className="text-[11px] font-normal text-slate-400 uppercase tracking-[0.15em]">Total Volume</p>
                            <p className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">{loading ? '...' : metrics.total}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md">
                        <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600 mr-4">
                            <IconClock size={26} />
                        </div>
                        <div>
                            <p className="text-[11px] font-normal text-slate-400 uppercase tracking-[0.15em]">Active Response</p>
                            <p className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">{loading ? '...' : metrics.open}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md">
                        <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-600 mr-4">
                            <IconUrgent size={26} />
                        </div>
                        <div>
                            <p className="text-[11px] font-normal text-slate-400 uppercase tracking-[0.15em]">High Severity</p>
                            <p className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">{loading ? '...' : metrics.highPriority}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md">
                        <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 mr-4">
                            <IconCheck size={26} />
                        </div>
                        <div>
                            <p className="text-[11px] font-normal text-slate-400 uppercase tracking-[0.15em]">Assigned to Me</p>
                            <p className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">{loading ? '...' : metrics.myActive}</p>
                        </div>
                    </div>
                </div>

                {/* Workflow Segmented Control */}
                <div className="bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200 inline-flex mb-8 overflow-x-auto max-w-full">
                    {visibleTabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => { setActiveTab(tab.key); setCurrentPage(1); updateUrlFilters(1, tab.key); }}
                            className={`flex items-center px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 ${activeTab === tab.key
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                                : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'
                                }`}
                            disabled={loading}
                        >
                            <span className={`mr-2.5 ${activeTab === tab.key ? 'text-white' : 'text-slate-400'}`}>
                                {tab.icon}
                            </span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Advanced Search Panel */}
                <TicketFilters
                    filters={currentFilters}
                    setters={filterSetters}
                    onApplyFilters={handleApplyFilters}
                    onClearFilters={handleClearFilters}
                    isDisclosureOpenByDefault={searchParams.toString().length > 0 && !searchParams.get('tab') && !searchParams.get('page')}
                    disableVendorAdminFilters={activeTab === 'unassigned' || activeTab === 'myTickets'}
                />

                {/* Ticket Catalog Card */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden transition-all hover:shadow-md">
                    <div className="px-8 py-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/30">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 flex items-center uppercase tracking-tight">
                                {visibleTabs.find(t => t.key === activeTab)?.label} Catalog
                                <span className="ml-3 px-2.5 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg tracking-widest shadow-sm">
                                    {totalCount} UNIT{totalCount !== 1 ? 'S' : ''}
                                </span>
                            </h2>
                            <p className="text-slate-400 text-xs font-normal mt-1 uppercase tracking-wider">
                                {loading ? 'Synchronizing records...' : `Visualizing items ${((currentPage - 1) * itemsPerPage) + 1} through ${Math.min(currentPage * itemsPerPage, totalCount)} `}
                            </p>
                        </div>

                        <div className="flex items-center space-x-3">
                            <Menu as="div" className="relative">
                                <MenuButton className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                                    <IconFilter size={16} className="mr-2 text-slate-400" />
                                    Quick View
                                    <IconChevronDown size={14} className="ml-2 text-slate-400" />
                                </MenuButton>
                                <Transition
                                    as={Fragment}
                                    enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100"
                                    leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95"
                                >
                                    <MenuItems className="absolute right-0 mt-2 w-56 origin-top-right bg-white divide-y divide-slate-50 rounded-2xl shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden border border-slate-100">
                                        <div className="px-1.5 py-1.5">
                                            {(['NEW', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as TicketStatus[]).map((status) => (
                                                <MenuItem key={status}>
                                                    {({ active }) => (
                                                        <button
                                                            onClick={() => { setStatusFilter(status); handleApplyFilters(); }}
                                                            className={`${active ? 'bg-slate-50 text-slate-900 translate-x-1' : 'text-slate-600'} group flex w-full items-center rounded-xl px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-200`}
                                                        >
                                                            <div className={`w-2 h-2 rounded-full mr-3 ${status === 'NEW' ? 'bg-blue-500' :
                                                                status === 'OPEN' ? 'bg-sky-500' :
                                                                    status === 'IN_PROGRESS' ? 'bg-violet-500' :
                                                                        'bg-emerald-500'
                                                                }`}></div>
                                                            {status.replace('_', ' ')} Records
                                                            {statusFilter === status && <IconCheck size={14} className="ml-auto text-indigo-500" />}
                                                        </button>
                                                    )}
                                                </MenuItem>
                                            ))}
                                        </div>
                                        <div className="px-1.5 py-1.5">
                                            <MenuItem>
                                                {({ active }) => (
                                                    <button
                                                        onClick={handleClearFilters}
                                                        className={`${active ? 'bg-rose-50 text-rose-600' : 'text-slate-500'} group flex w-full items-center rounded-xl px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-200`}
                                                    >
                                                        <IconFilter size={14} className="mr-3 opacity-60" />
                                                        Clear All Views
                                                    </button>
                                                )}
                                            </MenuItem>
                                        </div>
                                    </MenuItems>
                                </Transition>
                            </Menu>
                        </div>
                    </div>

                    <TicketList
                        tickets={tickets}
                        loading={loading && tickets.length === 0}
                        actionLoadingTicketId={actionLoadingTicketId}
                        detailsLoadingTicketId={detailsLoadingTicketId}
                        onViewEditTicket={handleViewEditTicket}
                        onSelfAssignTicket={handleSelfAssignTicket}
                        showSelfAssignButton={activeTab === 'unassigned' && canSelfAssignTickets}
                    />

                    {totalCount > itemsPerPage && (
                        <div className="px-8 py-5 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                Data Page <span className="text-slate-900">{currentPage}</span> of <span className="text-slate-900">{totalPages}</span>
                            </p>
                            <div className="flex space-x-2">
                                <button
                                    onClick={handlePrevPage}
                                    disabled={currentPage === 1 || loading}
                                    className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                                >
                                    <IconChevronLeft size={18} />
                                </button>
                                <button
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages || loading}
                                    className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                                >
                                    <IconChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <TicketFormModal
                isOpen={isFormModalOpen}
                onClose={handleFormModalClose}
                ticket={selectedTicketDetails}
                onSuccess={() => { fetchTickets(currentPage, activeTab); }}
            />
        </div>
    );
}

export default TicketsPage;