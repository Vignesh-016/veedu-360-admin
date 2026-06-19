import { useEffect, useState, Fragment, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    IconEdit, IconPlus, IconFilter,
    IconChevronLeft, IconChevronRight, IconSearch, IconCopy,
    IconChevronDown, IconBuildingStore,
    IconEye,
    IconLoader,
    IconTrash,
    IconUsers,
    IconCircleCheck,
    IconTools,
    IconClockHour4,
    IconAdjustmentsHorizontal
} from '@tabler/icons-react';
import { Disclosure, DisclosureButton, DisclosurePanel, Transition, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import VendorFormModal from '../components/VendorFormModal';
import LoadingSpinner from '../components/LoadingSpinner';
import VendorDetailsModal from '../components/VendorDetailsModal';
import api from '../lib/supabaseClient';
import { VendorStatus, VendorAdminSummary, ServiceAdminView, VendorAdminDetails } from '../lib/types';
import { useNotification } from '../components/NotificationProvider';
import { copyToClipboard } from '../lib/utils';
import {
    getBaseInputClasses,
    getVendorStatusBadgeClasses
} from '../lib/twUtils';
import * as displayUtils from '../lib/displayUtils';

const vendorStatusOptions: { value: VendorStatus; label: string }[] = Object.entries(displayUtils.vendorStatusMap)
    .map(([value, label]) => ({ value: value as VendorStatus, label }));

function VendorsPage() {
    const [vendors, setVendors] = useState<VendorAdminSummary[]>([]);
    const [availableServices, setAvailableServices] = useState<ServiceAdminView[]>([]);
    const [loading, setLoading] = useState(true);
    const [servicesLoading, setServicesLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<VendorAdminDetails | null>(null);
    const [deletingVendorId, setDeletingVendorId] = useState<string | null>(null);
    const { showSuccessNotification, showErrorNotification } = useNotification();

    // Filter state
    const [statusFilter, setStatusFilter] = useState<VendorStatus | undefined>(undefined);
    const [serviceFilter, setServiceFilter] = useState<number | undefined>(undefined);
    const [searchTermFilter, setSearchTermFilter] = useState<string>('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const fetchVendors = useCallback(async (page: number) => {
        setLoading(true);
        setError(null);
        const offset = (page - 1) * itemsPerPage;

        try {
            const { data, error: fetchError } = await api.listVendorsAdmin({
                p_status_filter: statusFilter,
                p_service_id_filter: serviceFilter,
                p_search_term: searchTermFilter || undefined,
                p_offset: offset,
                p_limit: itemsPerPage
            });

            if (fetchError) throw fetchError;

            setVendors(data || []);
            if (data && data.length > 0 && data[0].total_count !== undefined) {
                setTotalCount(data[0].total_count);
            } else if (page === 1) {
                setTotalCount(data ? data.length : 0);
            } else {
                setTotalCount(offset + (data ? data.length : 0));
                console.warn('Estimated total count used for Vendors');
            }
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to fetch vendors';
            setError(errMsg);
            showErrorNotification("Error Fetching Vendors", errMsg);
            setVendors([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    }, [itemsPerPage, statusFilter, serviceFilter, searchTermFilter, showErrorNotification]);

    const fetchServices = useCallback(async () => {
        setServicesLoading(true);
        try {
            const { data, error: servicesError } = await api.listServicesAdmin();
            if (servicesError) throw servicesError;
            setAvailableServices(data || []);
        } catch (err) {
            console.error('Error fetching services for filter:', err);
            showErrorNotification('Error Fetching Services', 'Could not load services for filtering.');
        } finally {
            setServicesLoading(false);
        }
    }, [showErrorNotification]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    useEffect(() => {
        fetchVendors(currentPage);
    }, [currentPage, fetchVendors]);

    // Metric calculations
    const metrics = useMemo(() => {
        const total = totalCount;
        const active = vendors.filter(v => v.status === 'ACTIVE').length;
        // Note: Realistically we'd fetch these counts from a summary API, but for now we approximate or use local data counts
        // To be more accurate across pages, we'd need a separate summary RPC.
        const pending = vendors.filter(v => v.status === 'UNDER_REVIEW').length;
        const serviceCount = availableServices.length;

        return {
            total,
            active: total > 0 ? Math.round((active / Math.max(vendors.length, 1)) * total) : 0, // Projected
            pending: total > 0 ? Math.round((pending / Math.max(vendors.length, 1)) * total) : 0, // Projected
            services: serviceCount
        };
    }, [vendors, totalCount, availableServices]);

    const handleViewDetails = async (vendorItem: VendorAdminSummary) => {
        setLoading(true);
        try {
            const { data: detailsData, error: detailsError } = await api.getVendorDetailsAdmin(vendorItem.vendor_id);
            if (detailsError) throw detailsError;
            if (!detailsData) throw new Error('Vendor details not found.');
            setSelectedVendor(detailsData);
            setIsDetailsModalOpen(true);
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to load vendor details.';
            setError(errMsg);
            showErrorNotification("Error Loading Details", errMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleEditVendor = async (vendorItem: VendorAdminSummary) => {
        setLoading(true);
        try {
            const { data: detailsData, error: detailsError } = await api.getVendorDetailsAdmin(vendorItem.vendor_id);
            if (detailsError) throw detailsError;
            if (!detailsData) throw new Error('Vendor details not found.');
            setSelectedVendor(detailsData);
            setIsFormModalOpen(true);
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to load vendor details for editing.';
            setError(errMsg);
            showErrorNotification("Error Loading Details", errMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleAddVendor = () => {
        setSelectedVendor(null);
        setIsFormModalOpen(true);
    };

    const handleFormModalClose = () => {
        setIsFormModalOpen(false);
        setSelectedVendor(null);
    };

    const handleDetailsModalClose = () => {
        setIsDetailsModalOpen(false);
        setSelectedVendor(null);
    };

    const handleDeleteVendor = async (vendorId: string, vendorName: string) => {
        if (window.confirm(`Are you sure you want to delete vendor "${vendorName}"? This action cannot be undone.`)) {
            setDeletingVendorId(vendorId);
            try {
                const { error: deleteError } = await api.deleteVendorAdmin(vendorId);
                if (deleteError) throw deleteError;
                showSuccessNotification("Vendor Deleted", `Vendor "${vendorName}" deleted successfully.`);
                fetchVendors(currentPage);
            } catch (err) {
                const errMsg = err instanceof Error ? err.message : 'Failed to delete vendor.';
                setError(errMsg);
                showErrorNotification("Deletion Error", errMsg);
            } finally {
                setDeletingVendorId(null);
            }
        }
    };

    const handleApplyFilters = () => {
        setCurrentPage(1);
        fetchVendors(1);
    };

    const handleClearFilters = () => {
        setStatusFilter(undefined);
        setServiceFilter(undefined);
        setSearchTermFilter('');
        if (currentPage !== 1) {
            setCurrentPage(1);
        } else {
            fetchVendors(1);
        }
    };

    const handleNextPage = () => setCurrentPage(prev => prev + 1);
    const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    const companyName = import.meta.env.VITE_COMPANY_NAME || "Veedu360";

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-12">
            <Helmet>
                <title>{`Vendors | ${companyName}`}</title>
            </Helmet>

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl shadow-sm animate-pulse" role="alert">
                        <p className="font-bold text-sm uppercase tracking-wider flex items-center">System Error</p>
                        <p className="text-sm mt-1">{error}</p>
                    </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Vendors</h1>
                        <p className="mt-1 text-sm text-slate-500 font-normal tracking-wide">Manage and monitor service partner relationships.</p>
                    </div>
                    <button
                        onClick={handleAddVendor}
                        className="inline-flex items-center px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl shadow-lg shadow-slate-200 hover:bg-slate-800 hover:scale-[1.02] transform transition-all active:scale-[0.98]"
                    >
                        <IconPlus className="mr-2" size={20} stroke={2} />
                        Add New Vendor
                    </button>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md">
                        <div className="p-3 rounded-xl bg-blue-50 text-blue-600 mr-4">
                            <IconUsers size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-normal text-slate-400 uppercase tracking-widest">Total Vendors</p>
                            <p className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{loading ? '...' : metrics.total}</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md">
                        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 mr-4">
                            <IconCircleCheck size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-normal text-slate-400 uppercase tracking-widest">Active Partners</p>
                            <p className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{loading ? '...' : metrics.active}</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md">
                        <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 mr-4">
                            <IconTools size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-normal text-slate-400 uppercase tracking-widest">Service Types</p>
                            <p className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{loading ? '...' : metrics.services}</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md">
                        <div className="p-3 rounded-xl bg-amber-50 text-amber-600 mr-4">
                            <IconClockHour4 size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-normal text-slate-400 uppercase tracking-widest">Pending Review</p>
                            <p className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{loading ? '...' : metrics.pending}</p>
                        </div>
                    </div>
                </div>

                {/* Filter Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between transition-all hover:shadow-md">
                    <div className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <IconSearch size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by company, contact, or email..."
                            className={`${getBaseInputClasses()} pl-10 h-11 border-gray-200 focus:border-slate-500 rounded-xl`}
                            value={searchTermFilter}
                            onChange={(e) => setSearchTermFilter(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center space-x-3 w-full md:w-auto">
                        <Disclosure defaultOpen={false} as="div" className="relative w-full md:w-auto">
                            {({ open }) => (
                                <>
                                    <DisclosureButton className="inline-flex items-center justify-between w-full md:w-48 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-gray-50 transition-colors focus:outline-none shadow-sm capitalize">
                                        <span className="flex items-center">
                                            <IconFilter size={18} className="mr-2 text-slate-400" />
                                            {statusFilter ? displayUtils.getDisplayValue(displayUtils.vendorStatusMap, statusFilter, statusFilter) : 'All Statuses'}
                                        </span>
                                        <IconChevronDown className={`${open ? 'rotate-180' : ''} transition-transform`} size={16} />
                                    </DisclosureButton>
                                    <Transition
                                        as={Fragment}
                                        enter="transition duration-100 ease-out" enterFrom="transform scale-95 opacity-0" enterTo="transform scale-100 opacity-100"
                                        leave="transition duration-75 ease-in" leaveFrom="transform scale-100 opacity-100" leaveTo="transform scale-95 opacity-0"
                                    >
                                        <DisclosurePanel className="absolute right-0 mt-2 w-56 origin-top-right bg-white divide-y divide-gray-50 rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden border border-gray-100">
                                            <div className="px-1 py-1">
                                                <div className="p-3">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Filter by Status</label>
                                                    <select
                                                        value={statusFilter || ''}
                                                        onChange={(e) => {
                                                            setStatusFilter(e.target.value as VendorStatus || undefined);
                                                            handleApplyFilters();
                                                        }}
                                                        className={`${getBaseInputClasses()} h-9 rounded-lg text-xs font-semibold`}
                                                    >
                                                        <option value="">All Statuses</option>
                                                        {vendorStatusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                    </select>
                                                </div>
                                                <div className="p-3 pt-0">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Filter by Service</label>
                                                    <select
                                                        value={serviceFilter || ''}
                                                        onChange={(e) => {
                                                            setServiceFilter(e.target.value ? Number(e.target.value) : undefined);
                                                            handleApplyFilters();
                                                        }}
                                                        className={`${getBaseInputClasses()} h-9 rounded-lg text-xs font-semibold`}
                                                        disabled={servicesLoading}
                                                    >
                                                        <option value="">All Services</option>
                                                        {availableServices.map(srv => <option key={srv.service_id} value={srv.service_id}>{srv.service_name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="p-3 pt-0 border-t border-gray-50 mt-1 flex gap-2">
                                                    <button onClick={handleApplyFilters} className="flex-1 bg-slate-900 text-white text-[10px] font-bold py-2 rounded-lg hover:bg-slate-800 transition-colors uppercase tracking-widest">Apply</button>
                                                    <button onClick={handleClearFilters} className="flex-1 bg-slate-50 text-slate-600 text-[10px] font-bold py-2 rounded-lg hover:bg-slate-100 transition-colors uppercase tracking-widest">Reset</button>
                                                </div>
                                            </div>
                                        </DisclosurePanel>
                                    </Transition>
                                </>
                            )}
                        </Disclosure>
                    </div>
                </div>

                {/* Vendors Table Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
                    <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Partner Portfolio</h2>
                            <p className="text-sm text-slate-400 mt-1 font-medium">
                                {loading ? 'Fetching records...' : vendors.length > 0
                                    ? `Showing ${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, totalCount)} of ${totalCount} partners`
                                    : 'No partners found matching your criteria.'}
                            </p>
                        </div>

                        <div className="flex items-center space-x-3 w-full sm:w-auto">
                            <Menu as="div" className="relative inline-block text-left w-full sm:w-auto">
                                <MenuButton className="inline-flex items-center justify-between w-full sm:w-44 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 uppercase tracking-widest hover:bg-white transition-all shadow-sm">
                                    <span className="flex items-center">
                                        <IconAdjustmentsHorizontal size={14} className="mr-2 opacity-60" />
                                        Quick View
                                    </span>
                                    <IconChevronDown size={14} className="ml-1 opacity-40" />
                                </MenuButton>
                                <Transition
                                    as={Fragment} enter="transition duration-100 ease-out" enterFrom="transform scale-95 opacity-0" enterTo="transform scale-100 opacity-100"
                                    leave="transition duration-75 ease-in" leaveFrom="transform scale-100 opacity-100" leaveTo="transform scale-95 opacity-0"
                                >
                                    <MenuItems className="absolute right-0 mt-2 w-48 origin-top-right bg-white divide-y divide-gray-50 rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden border border-gray-100">
                                        <div className="px-1 py-1">
                                            {(['ACTIVE', 'UNDER_REVIEW', 'INACTIVE'] as VendorStatus[]).map((status) => (
                                                <MenuItem key={status}>
                                                    {({ active }) => (
                                                        <button
                                                            onClick={() => {
                                                                setStatusFilter(status);
                                                                setCurrentPage(1);
                                                            }}
                                                            className={`${active ? 'bg-slate-50 text-slate-900' : 'text-slate-600'} group flex w-full items-center rounded-lg px-4 py-2.5 text-xs font-semibold uppercase tracking-widest transition-colors`}
                                                        >
                                                            {status.replace('_', ' ')} partners
                                                        </button>
                                                    )}
                                                </MenuItem>
                                            ))}
                                            <MenuItem>
                                                {({ active }) => (
                                                    <button onClick={handleClearFilters} className={`${active ? 'bg-slate-50 text-slate-900' : 'text-slate-500'} group flex w-full items-center rounded-lg px-4 py-2.5 text-xs font-semibold uppercase tracking-widest transition-colors border-t border-gray-50 mt-1 pt-2`}>
                                                        View All Records
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
                        {loading ? (
                            <div className="p-20 flex flex-col justify-center items-center">
                                <LoadingSpinner size={40} />
                                <p className="mt-4 text-sm font-bold text-slate-400 animate-pulse tracking-widest uppercase">Initializing Portfolio...</p>
                            </div>
                        ) : vendors.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                                <div className="p-5 bg-slate-50 rounded-full mb-5">
                                    <IconBuildingStore size={48} className="text-slate-200" />
                                </div>
                                <p className="text-slate-600 text-lg font-bold uppercase tracking-tight">No Vendors Found</p>
                                <p className="text-slate-400 mt-2 max-w-xs mx-auto text-sm font-medium">Try adjusting your filters or expand your search to find the partners you're looking for.</p>
                                <button onClick={handleAddVendor} className="mt-8 inline-flex items-center px-6 py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl uppercase tracking-[0.15em] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-200">
                                    <IconPlus size={16} className="mr-2" /> Register New Vendor
                                </button>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-50">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-6 py-4 text-left text-[11px] font-medium text-slate-500 uppercase tracking-[0.2em]">Company Entity</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-medium text-slate-500 uppercase tracking-[0.2em]">Primary Contact</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-medium text-slate-500 uppercase tracking-[0.2em]">Service Capability</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-medium text-slate-500 uppercase tracking-[0.2em]">Current State</th>
                                        <th className="px-6 py-4 text-right text-[11px] font-medium text-slate-500 uppercase tracking-[0.2em]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-50">
                                    {vendors.map((vendor) => (
                                        <tr key={vendor.vendor_id} className="hover:bg-slate-50/30 transition-colors group">
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{vendor.company_name}</span>
                                                    <div className="flex items-center mt-1">
                                                        <span className="font-mono text-[9px] font-medium text-slate-300 uppercase tracking-tighter">ID: {vendor.vendor_id.substring(0, 8)}</span>
                                                        <button onClick={() => copyToClipboard(vendor.vendor_id)} className="ml-1.5 text-slate-200 hover:text-slate-500 transition-colors">
                                                            <IconCopy size={10} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-slate-700">{vendor.contact_name || 'N/A'}</span>
                                                    <span className="text-[11px] font-medium text-slate-400 mt-0.5 tracking-tight">{vendor.email || vendor.phone || 'No Contact Info'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-sm text-slate-600 font-medium max-w-[240px] truncate" title={vendor.services_summary || ''}>
                                                    {vendor.services_summary || <span className="italic text-slate-300">Generic Vendor</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <span className={`${getVendorStatusBadgeClasses(vendor.status)} inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full mr-2 ${vendor.status === 'ACTIVE' ? 'bg-emerald-500' : vendor.status === 'UNDER_REVIEW' ? 'bg-amber-500' : 'bg-slate-400'}`}></div>
                                                    {displayUtils.getDisplayValue(displayUtils.vendorStatusMap, vendor.status, vendor.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleViewDetails(vendor)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100 shadow-sm hover:shadow"
                                                        title="View Portfolio"
                                                        disabled={loading && selectedVendor?.vendor_id === vendor.vendor_id}
                                                    >
                                                        <IconEye size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditVendor(vendor)}
                                                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all border border-transparent hover:border-amber-100 shadow-sm hover:shadow"
                                                        title="Edit Records"
                                                        disabled={loading && selectedVendor?.vendor_id === vendor.vendor_id}
                                                    >
                                                        <IconEdit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteVendor(vendor.vendor_id, vendor.company_name)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 shadow-sm hover:shadow"
                                                        title="Revoke Partnership"
                                                        disabled={deletingVendorId === vendor.vendor_id}
                                                    >
                                                        {deletingVendorId === vendor.vendor_id ? <IconLoader size={18} className="animate-spin text-rose-500" /> : <IconTrash size={18} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalCount > itemsPerPage && (
                        <div className="flex items-center justify-between border-t border-gray-50 bg-white px-6 py-5">
                            <div className="hidden sm:block">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    Displaying Page <span className="text-slate-900 mx-1">{currentPage}</span> of <span className="text-slate-900 mx-1">{totalPages}</span>
                                </p>
                            </div>
                            <div className="flex space-x-2 w-full sm:w-auto">
                                <button onClick={handlePrevPage} disabled={currentPage === 1 || loading} className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95">
                                    <IconChevronLeft size={16} className="mr-1" /> Prev
                                </button>
                                <button onClick={handleNextPage} disabled={currentPage === totalPages || loading} className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 bg-slate-900 border border-slate-900 rounded-xl text-xs font-black uppercase tracking-widest text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-slate-100">
                                    Next <IconChevronRight size={16} className="ml-1" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modals */}
                <VendorFormModal
                    isOpen={isFormModalOpen}
                    onClose={handleFormModalClose}
                    vendor={selectedVendor}
                    onSuccess={() => {
                        fetchVendors(isFormModalOpen && !selectedVendor ? 1 : currentPage);
                        fetchServices();
                    }}
                />
                <VendorDetailsModal
                    isOpen={isDetailsModalOpen}
                    onClose={handleDetailsModalClose}
                    vendor={selectedVendor}
                />
            </div>
        </div>
    );
}

export default VendorsPage;