import { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    IconHomeCheck, IconChevronLeft, IconChevronRight, IconEye, IconCopy, IconFilter, IconChevronDown, IconSearch, IconCalendar, IconCurrencyRupee, IconAlertCircle, IconCheck, IconClock, IconBuildingCommunity, IconUser, IconX
} from '@tabler/icons-react';
import { Disclosure, Transition } from '@headlessui/react';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../lib/supabaseClient';
import { OccupiedPropertiesRentStatusReportAdminResults, RentStatus } from '../lib/types';
import { useNotification } from '../components/NotificationProvider';
import { copyToClipboard, formatDate, formatTimestamp } from '../lib/utils';
import {
    getSecondaryButtonClasses, getStatusBadgeClasses, getBaseInputClasses, getPrimaryButtonClasses
} from '../lib/twUtils';
import PropertyPaymentHistoryModal from '../components/PropertyPaymentHistoryModal';
import { getDisplayValue, rentStatusMap } from '../lib/displayUtils';

function OccupancyRentStatusPage() {
    const [records, setRecords] = useState<OccupiedPropertiesRentStatusReportAdminResults>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { showErrorNotification } = useNotification();

    // Filter state (Simple for now)
    const [propertySearch, setPropertySearch] = useState<string>('');
    const [tenantSearch, setTenantSearch] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<RentStatus | undefined>(undefined);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);
    const [totalCount, setTotalCount] = useState(0);

    // Modal State
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
    const [selectedPropertyName, setSelectedPropertyName] = useState<string | null>(null);

    // Fetch Data
    const fetchData = useCallback(async (page: number = currentPage) => {
        setLoading(true);
        setError(null);
        const offset = (page - 1) * itemsPerPage;

        try {
            const { data, error: fetchError } = await api.getOccupiedPropertiesRentStatusReportAdmin({
                p_property_search: propertySearch || undefined,
                p_tenant_search: tenantSearch || undefined,
                p_rent_status_filter: statusFilter,
                p_offset: offset,
                p_limit: itemsPerPage
            });
            if (fetchError) throw fetchError;

            setRecords(data || []);
            if (data && data.length > 0 && data[0].total_count !== undefined) {
                setTotalCount(data[0].total_count);
            } else if (page === 1) {
                setTotalCount(data ? data.length : 0);
            } else {
                setTotalCount(offset + (data ? data.length : 0));
                console.warn('Estimated total count used for Occupancy Status');
            }
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to fetch occupancy status';
            setError(errMsg);
            showErrorNotification("Error Fetching Data", errMsg);
            setRecords([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, propertySearch, tenantSearch, statusFilter, showErrorNotification]);

    // Initial fetch & refetch on page change
    useEffect(() => {
        fetchData(currentPage);
    }, [currentPage, fetchData]);

    // Filter Triggers
    const handleApplyFilters = () => {
        setCurrentPage(1); // Reset page on filter change
        fetchData(1);
    };

    const handleClearFilters = () => {
        setPropertySearch('');
        setTenantSearch('');
        setStatusFilter(undefined);
        if (currentPage !== 1) {
            setCurrentPage(1);
        } else {
            fetchData(1); // Fetch with cleared filters if already on page 1
        }
    };

    // Pagination Handlers
    const handleNextPage = () => setCurrentPage(prev => prev + 1);
    const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    // Modal Handler
    const handleViewHistory = (propertyId: string, propertyAddress: string) => {
        setSelectedPropertyId(propertyId);
        setSelectedPropertyName(propertyAddress);
        setIsHistoryModalOpen(true);
    };

    const handleHistoryModalClose = () => {
        setIsHistoryModalOpen(false);
        setSelectedPropertyId(null);
        setSelectedPropertyName(null);
    };
    const companyName = import.meta.env.VITE_COMPANY_NAME;

    // Metrics (Calculated from current view for demonstration, but ideally comes from global stats)
    const paidCount = records?.filter(r => r.latest_rent_record_status === 'PAID').length || 0;
    const overdueCount = records?.filter(r => r.latest_rent_record_status === 'OVERDUE').length || 0;
    const pendingCount = records?.filter(r => r.latest_rent_record_status === 'DUE').length || 0;

    const MetricCard = ({ title, value, icon: Icon, bgClass, iconClass, subValue }: { title: string, value: string | number, icon: any, bgClass: string, iconClass: string, subValue?: string }) => (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all duration-300 hover:shadow-md group flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${bgClass} ${iconClass} transition-colors flex-shrink-0`}>
                <Icon size={24} />
            </div>
            <div className="flex-grow">
                <p className="text-xs font-normal text-gray-400 mb-0.5 uppercase tracking-wider">{title}</p>
                <div className="flex items-baseline justify-between">
                    <h3 className="text-2xl font-bold text-gray-900 leading-none tracking-tight">{value}</h3>
                    {subValue && <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">{subValue}</span>}
                </div>
            </div>
        </div>
    );

    const QuickFilterTab = ({ label, count, active, onClick, icon: Icon }: { label: string, count?: number, active: boolean, onClick: () => void, icon?: any }) => (
        <button
            onClick={onClick}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${active
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
        >
            {Icon && <Icon size={16} className={`mr-2 ${active ? 'text-blue-400' : 'text-gray-400'}`} />}
            {label}
            {count !== undefined && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] ${active ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-500'}`}>
                    {count}
                </span>
            )}
        </button>
    );

    return (
        <>
            <Helmet>
                <title>{`Occupancy & Rent Status | ${companyName}`}</title>
            </Helmet>

            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    {error && (
                        <div className="mb-6 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-md shadow" role="alert">
                            <p className="font-bold">Error</p>
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Occupancy & Rent Status</h1>
                            <p className="mt-1 text-sm text-gray-500 font-normal italic">Real-time overview of occupied properties and collections status.</p>
                        </div>
                        <div className="flex gap-2">
                            <button className={`${getSecondaryButtonClasses()} !rounded-full px-5 shadow-sm active:scale-95 transition-transform`}>
                                <IconCalendar className="mr-2 text-gray-400" size={18} />
                                Export Report
                            </button>
                        </div>
                    </div>

                    {/* Metric Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <MetricCard
                            title="Total Occupied"
                            value={totalCount}
                            icon={IconBuildingCommunity}
                            bgClass="bg-blue-50"
                            iconClass="text-blue-600"
                        />
                        <MetricCard
                            title="Rent Collected"
                            value={paidCount}
                            icon={IconCheck}
                            bgClass="bg-emerald-50"
                            iconClass="text-emerald-600"
                            subValue="Paid"
                        />
                        <MetricCard
                            title="Rent Overdue"
                            value={overdueCount}
                            icon={IconAlertCircle}
                            bgClass="bg-red-50"
                            iconClass="text-red-600"
                            subValue="Overdue"
                        />
                        <MetricCard
                            title="Pending Collection"
                            value={pendingCount}
                            icon={IconClock}
                            bgClass="bg-amber-50"
                            iconClass="text-amber-600"
                            subValue="Awaiting"
                        />
                    </div>

                    {/* Quick Tabs & Filters Container */}
                    <div className="space-y-6 mb-8">
                        <div className="flex flex-wrap gap-2 items-center">
                            <QuickFilterTab label="All Units" count={totalCount} active={!statusFilter} onClick={() => { setStatusFilter(undefined); setCurrentPage(1); }} />
                            <QuickFilterTab label="Collected" icon={IconCheck} active={statusFilter === 'PAID'} onClick={() => { setStatusFilter('PAID'); setCurrentPage(1); }} />
                            <QuickFilterTab label="Overdue" icon={IconAlertCircle} active={statusFilter === 'OVERDUE'} onClick={() => { setStatusFilter('OVERDUE'); setCurrentPage(1); }} />
                            <QuickFilterTab label="Pending" icon={IconClock} active={statusFilter === 'DUE'} onClick={() => { setStatusFilter('DUE'); setCurrentPage(1); }} />
                        </div>

                        <Disclosure>
                            {({ open }) => (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                    <Disclosure.Button className="w-full flex items-center justify-between px-6 py-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-2 text-slate-700">
                                            <IconFilter size={18} className="text-slate-400" />
                                            <span className="text-sm font-medium">Advanced Search Filters</span>
                                            {(propertySearch || tenantSearch) && (
                                                <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold">Active</span>
                                            )}
                                        </div>
                                        <IconChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                                    </Disclosure.Button>

                                    <Transition
                                        enter="transition duration-150 ease-out"
                                        enterFrom="transform scale-95 opacity-0"
                                        enterTo="transform scale-100 opacity-100"
                                        leave="transition duration-100 ease-in"
                                        leaveFrom="transform scale-100 opacity-100"
                                        leaveTo="transform scale-95 opacity-0"
                                    >
                                        <Disclosure.Panel className="px-6 py-6 border-t border-gray-100">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-widest mb-2 flex items-center">
                                                            <IconBuildingCommunity size={14} className="mr-1.5" /> Property Location
                                                        </label>
                                                        <div className="relative">
                                                            <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                            <input
                                                                type="text"
                                                                value={propertySearch}
                                                                onChange={(e) => setPropertySearch(e.target.value)}
                                                                className={`${getBaseInputClasses()} pl-10 !rounded-xl`}
                                                                placeholder="Search address, city, locality..."
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-widest mb-2 flex items-center">
                                                            <IconUser size={14} className="mr-1.5" /> Tenant Information
                                                        </label>
                                                        <div className="relative">
                                                            <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                            <input
                                                                type="text"
                                                                value={tenantSearch}
                                                                onChange={(e) => setTenantSearch(e.target.value)}
                                                                className={`${getBaseInputClasses()} pl-10 !rounded-xl`}
                                                                placeholder="Search name, email, phone..."
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                                                <button onClick={handleClearFilters} className="text-sm font-medium text-gray-400 hover:text-gray-600 flex items-center gap-1.5 transition-colors">
                                                    <IconX size={16} /> Reset Filters
                                                </button>
                                                <div className="flex gap-3">
                                                    <Disclosure.Button onClick={handleApplyFilters} className={`${getPrimaryButtonClasses()} !rounded-xl px-8 shadow-md shadow-blue-100 hover:shadow-lg transition-all`}>
                                                        Apply Search
                                                    </Disclosure.Button>
                                                </div>
                                            </div>
                                        </Disclosure.Panel>
                                    </Transition>
                                </div>
                            )}
                        </Disclosure>
                    </div>

                    {/* Table Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
                        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30">
                            <div>
                                <h2 className="text-lg font-medium text-gray-800 flex items-center">
                                    <IconBuildingCommunity size={20} className="mr-2 text-slate-400" /> Occupied Rentals Overview
                                </h2>
                                <p className="text-xs text-gray-400 mt-1 font-normal">
                                    {records && records.length > 0
                                        ? `Displaying ${((currentPage - 1) * itemsPerPage) + 1} - ${Math.min(currentPage * itemsPerPage, totalCount)} of ${totalCount} assigned units`
                                        : 'No occupied properties found matching criteria.'}
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            {loading ? (
                                <div className="p-10 flex justify-center"><LoadingSpinner /></div>
                            ) : records && records.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                                    <IconHomeCheck size={48} className="text-gray-300 mb-4" />
                                    <p className="text-gray-500 text-lg font-medium">No occupied properties found</p>
                                    <p className="text-gray-400 mt-1">Try adjusting filters or check property assignments.</p>
                                </div>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-[0.2em]">
                                                <div className="flex items-center"><IconBuildingCommunity size={14} className="mr-1.5 opacity-60" /> Property</div>
                                            </th>
                                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-[0.2em]">
                                                <div className="flex items-center"><IconUser size={14} className="mr-1.5 opacity-60" /> Tenant</div>
                                            </th>
                                            <th scope="col" className="px-6 py-3.5 text-center text-xs font-medium text-gray-500 uppercase tracking-[0.2em]">
                                                <div className="flex justify-center items-center"><IconCalendar size={14} className="mr-1.5 opacity-60" /> Due Day</div>
                                            </th>
                                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-[0.2em]">Rent Status</th>
                                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-[0.2em]">
                                                <div className="flex items-center"><IconCurrencyRupee size={14} className="mr-1.5 opacity-60" /> Last Payment</div>
                                            </th>
                                            <th scope="col" className="px-6 py-3.5 text-right text-xs font-medium text-gray-500 uppercase tracking-[0.2em]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {records && records.map((record) => (
                                            <tr key={record.property_id} className="hover:bg-blue-50/30 transition-colors duration-200 group">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700 transition-colors">{record.property_address}</span>
                                                        <span className="text-[11px] text-gray-400 mt-0.5">{record.property_city}</span>
                                                        <div className="mt-1.5 flex items-center space-x-2">
                                                            <code className="text-[10px] bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded border border-slate-100 font-mono">
                                                                {record.property_id.substring(0, 8)}
                                                            </code>
                                                            <button onClick={() => copyToClipboard(record.property_id)} className="text-gray-300 hover:text-blue-500 transition-colors">
                                                                <IconCopy size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-gray-700">{record.tenant_name || <span className="italic text-gray-300">Unassigned</span>}</span>
                                                        <div className="mt-1 space-y-0.5">
                                                            <span className="block text-[11px] text-gray-400 italic">{record.tenant_email || '-'}</span>
                                                            <span className="block text-[11px] text-gray-400">{record.tenant_phone || '-'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="inline-flex items-center justify-center px-2 py-1 rounded bg-slate-50 border border-slate-100 text-xs font-bold text-slate-600 min-w-[40px]">
                                                        {record.property_rent_due_day || '--'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col items-start gap-1.5">
                                                        {record.latest_rent_record_status ? (
                                                            <div className="flex items-center">
                                                                <span className={`${getStatusBadgeClasses(record.latest_rent_record_status)} relative flex items-center gap-1.5`}>
                                                                    {record.latest_rent_record_status === 'OVERDUE' && (
                                                                        <span className="flex h-2 w-2 relative">
                                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                                        </span>
                                                                    )}
                                                                    {getDisplayValue(rentStatusMap, record.latest_rent_record_status)}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-300 italic">No Rent History</span>
                                                        )}
                                                        {record.latest_rent_record_due_date && (
                                                            <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                                                Due: {formatDate(record.latest_rent_record_due_date)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm text-gray-600 font-medium">
                                                            {record.last_payment_date_for_latest_record ? formatTimestamp(record.last_payment_date_for_latest_record) : <span className="italic text-gray-300">--</span>}
                                                        </span>
                                                        {record.last_payment_date_for_latest_record && (
                                                            <span className="text-[10px] text-emerald-600 font-medium mt-0.5 flex items-center">
                                                                <IconCheck size={10} className="mr-0.5" /> Verified
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2 translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                                        <button
                                                            onClick={() => handleViewHistory(record.property_id, record.property_address)}
                                                            className={`${getSecondaryButtonClasses()} !p-1.5 hover:bg-blue-50 hover:text-blue-600 border-none shadow-none`}
                                                            title="Timeline"
                                                        >
                                                            <IconEye size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Pagination Controls */}
                        {totalCount > itemsPerPage && (
                            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-6 py-4 rounded-b-2xl">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">
                                        Page <span className="text-slate-900">{currentPage}</span> of <span className="text-slate-900">{totalPages}</span>
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handlePrevPage}
                                        disabled={currentPage === 1 || loading}
                                        className={`${getSecondaryButtonClasses()} !rounded-xl !px-4 disabled:opacity-30 disabled:cursor-not-allowed`}
                                    >
                                        <IconChevronLeft size={18} className="mr-1" /> Previous
                                    </button>
                                    <button
                                        onClick={handleNextPage}
                                        disabled={currentPage === totalPages || loading}
                                        className={`${getSecondaryButtonClasses()} !rounded-xl !px-4 disabled:opacity-30 disabled:cursor-not-allowed`}
                                    >
                                        Next <IconChevronRight size={18} className="ml-1" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Payment History Modal */}
            <PropertyPaymentHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={handleHistoryModalClose}
                propertyId={selectedPropertyId}
                propertyName={selectedPropertyName}
            />
        </>
    );
}

export default OccupancyRentStatusPage;