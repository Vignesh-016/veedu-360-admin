import { useEffect, useState, Fragment, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    IconChevronDown, IconChevronUp, IconFilter, IconRefresh,
    IconChevronLeft, IconChevronRight, IconCopy, IconCalendar, IconUser,
    IconFileDollar, IconTag, IconReceipt, IconFileCheck, IconFileX, IconFileTime, IconCircleDashed,
    IconListCheck, IconChartBar, IconCurrencyRupee, IconArrowUpRight, IconAlertTriangle,
    IconAdjustmentsHorizontal, IconCheck
} from '@tabler/icons-react';
import { Disclosure, DisclosureButton, DisclosurePanel, Transition, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../lib/supabaseClient';
import { TransactionAdminView, GetAllTransactionsAdminParams } from '../lib/types';
import { useNotification } from '../components/NotificationProvider';
import { copyToClipboard, formatTimestamp } from '../lib/utils';
import { getBaseInputClasses, getStatusBadgeClasses } from '../lib/twUtils';

const transactionStatuses = ['paid', 'created', 'failed', 'attempted', 'refunded'] as const;

function TransactionsPage() {
    const [transactions, setTransactions] = useState<TransactionAdminView[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { showErrorNotification } = useNotification();
    const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);

    // Filter states
    const [userIdFilter, setUserIdFilter] = useState<string>('');
    const [planIdFilter, setPlanIdFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [razorpayOrderIdFilter, setRazorpayOrderIdFilter] = useState<string>('');
    const [createdAtStartFilter, setCreatedAtStartFilter] = useState<string>('');
    const [createdAtEndFilter, setCreatedAtEndFilter] = useState<string>('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const fetchTransactions = useCallback(async (page: number = currentPage) => {
        setLoading(true);
        setError(null);
        const offset = (page - 1) * itemsPerPage;

        const params: GetAllTransactionsAdminParams = {
            p_customer_user_id_filter: userIdFilter || undefined,
            p_plan_id_filter: planIdFilter || undefined,
            p_statuses_filter: statusFilter.length > 0 ? statusFilter : undefined,
            p_razorpay_order_id_filter: razorpayOrderIdFilter || undefined,
            p_created_at_start: createdAtStartFilter || undefined,
            p_created_at_end: createdAtEndFilter || undefined,
            p_offset: offset,
            p_limit: itemsPerPage
        };

        try {
            const { data, error: fetchError } = await api.getAllTransactionsAdmin(params);

            if (fetchError) {
                throw new Error(typeof fetchError === 'string' ? fetchError : fetchError.message);
            }

            setTransactions(data || []);
            if (data && data.length > 0 && data[0].total_count !== undefined) {
                setTotalCount(data[0].total_count);
            } else if (page === 1) {
                setTotalCount(data ? data.length : 0);
            } else {
                setTotalCount(offset + (data ? data.length : 0));
                console.warn('Estimated Page Count is used for Transactions')
            }

        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to fetch transactions';
            setError(errMsg);
            showErrorNotification("Error Fetching Transactions", errMsg);
            setTransactions([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, userIdFilter, planIdFilter, statusFilter, razorpayOrderIdFilter, createdAtStartFilter, createdAtEndFilter, showErrorNotification]);

    useEffect(() => {
        fetchTransactions(currentPage);
    }, [currentPage, fetchTransactions]);

    // Metric calculations (based on current page data as a proxy or if we had a separate summary API)
    // For now, using the totalCount and basic stats from current page to illustrate
    const metrics = useMemo(() => {
        const paidCount = transactions.filter(t => t.status === 'paid').length;
        const totalAmount = transactions.filter(t => t.status === 'paid').reduce((acc, t) => acc + (t.amount || 0), 0);
        const failureCount = transactions.filter(t => t.status === 'failed' || t.status === 'refunded').length;

        return {
            total: totalCount,
            paid: totalCount > 0 ? Math.round((paidCount / transactions.length) * totalCount) : 0, // Projected
            revenue: totalAmount * (totalCount / Math.max(transactions.length, 1)), // Projected revenue
            issues: failureCount * (totalCount / Math.max(transactions.length, 1)) // Projected issues
        };
    }, [transactions, totalCount]);

    const handleApplyFilters = () => {
        setCurrentPage(1);
        fetchTransactions(1);
    };

    const handleClearFilters = () => {
        setUserIdFilter('');
        setPlanIdFilter('');
        setStatusFilter([]);
        setRazorpayOrderIdFilter('');
        setCreatedAtStartFilter('');
        setCreatedAtEndFilter('');
        if (currentPage !== 1) {
            setCurrentPage(1);
        } else {
            fetchTransactions(1);
        }
    };

    const handleStatusCheckboxChange = (statusValue: string) => {
        setStatusFilter(prev => {
            if (prev.includes(statusValue)) {
                return prev.filter(s => s !== statusValue);
            } else {
                return [...prev, statusValue];
            }
        });
    };

    const toggleTransactionDetails = (transactionId: string) => {
        setExpandedTransactionId(expandedTransactionId === transactionId ? null : transactionId);
    };

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    const getStatusIcon = (status: string | null | undefined) => {
        switch (status) {
            case 'paid': return <IconFileCheck size={16} className="text-emerald-600" />;
            case 'created': return <IconFileTime size={16} className="text-blue-600" />;
            case 'failed': return <IconFileX size={16} className="text-red-600" />;
            case 'attempted': return <IconFileDollar size={16} className="text-amber-600" />;
            case 'refunded': return <IconCircleDashed size={16} className="text-slate-600" />;
            default: return null;
        }
    };

    const companyName = import.meta.env.VITE_COMPANY_NAME || "Veedu360";

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-12">
            <Helmet>
                <title>{`Transactions | ${companyName}`}</title>
            </Helmet>

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl shadow-sm animate-pulse" role="alert">
                        <p className="font-bold text-sm uppercase tracking-wider flex items-center"><IconAlertTriangle size={16} className="mr-2" /> System Error</p>
                        <p className="text-sm mt-1">{error}</p>
                    </div>
                )}

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Transactions</h1>
                    <p className="mt-1 text-sm text-slate-500 font-medium tracking-wide">Monitor and manage all customer payment activities.</p>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md">
                        <div className="p-3 rounded-xl bg-slate-900 text-white mr-4 shadow-lg shadow-slate-100">
                            <IconChartBar size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-normal text-slate-400 uppercase tracking-widest">Total Count</p>
                            <p className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{loading ? '...' : totalCount}</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md">
                        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 mr-4">
                            <IconCurrencyRupee size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-normal text-slate-400 uppercase tracking-widest">Revenue (Est.)</p>
                            <p className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
                                {loading ? '...' : `₹${Math.round(metrics.revenue).toLocaleString()}`}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md group">
                        <div className="p-3 rounded-xl bg-blue-50 text-blue-600 mr-4">
                            <IconArrowUpRight size={24} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                        <div>
                            <p className="text-xs font-normal text-slate-400 uppercase tracking-widest">Success Rate</p>
                            <p className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
                                {loading ? '...' : `${totalCount > 0 ? Math.round((metrics.paid / totalCount) * 100) : 0}%`}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md">
                        <div className="p-3 rounded-xl bg-rose-50 text-rose-600 mr-4">
                            <IconAlertTriangle size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-normal text-slate-400 uppercase tracking-widest">Failed/Ref.</p>
                            <p className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
                                {loading ? '...' : Math.round(metrics.issues)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden transition-all hover:shadow-md">
                    <Disclosure defaultOpen={false} as="div">
                        {({ open }) => (
                            <>
                                <DisclosureButton className="flex justify-between w-full px-6 py-4 text-left text-sm font-medium text-slate-700 bg-slate-50/50 hover:bg-slate-100 transition-colors focus:outline-none">
                                    <span className="flex items-center uppercase tracking-widest">
                                        <IconFilter className="mr-2 text-slate-400" size={18} />
                                        Advanced Search
                                    </span>
                                    <IconChevronDown className={`${open ? 'transform rotate-180' : ''} w-5 h-5 text-slate-400 transition-transform`} />
                                </DisclosureButton>
                                <Transition
                                    as={Fragment}
                                    enter="transition ease-out duration-200" leave="transition ease-in duration-150"
                                    enterFrom="opacity-0 -translate-y-1" enterTo="opacity-100 translate-y-0"
                                    leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 -translate-y-1"
                                >
                                    <DisclosurePanel className="px-6 pt-5 pb-7 border-t border-gray-100">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                                            {/* Status Filter */}
                                            <div className="col-span-full md:col-span-1">
                                                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center opacity-80">
                                                    <IconListCheck size={14} className="mr-1.5" /> Status Selection
                                                </label>
                                                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-100 rounded-xl p-3 bg-slate-50/30">
                                                    {transactionStatuses.map((status) => (
                                                        <div key={status} className="flex items-center group cursor-pointer" onClick={() => handleStatusCheckboxChange(status)}>
                                                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${statusFilter.includes(status) ? 'bg-slate-900 border-slate-900' : 'bg-white border-gray-200 group-hover:border-slate-400'}`}>
                                                                {statusFilter.includes(status) && <IconCheck size={14} className="text-white" />}
                                                            </div>
                                                            <span className={`ml-2.5 text-sm font-medium capitalize transition-colors ${statusFilter.includes(status) ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`}>
                                                                {status}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Other Filters */}
                                            <div className="col-span-full md:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                                <div>
                                                    <label htmlFor="userIdFilter" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center opacity-80">
                                                        <IconUser size={14} className="mr-1.5" /> Customer Search
                                                    </label>
                                                    <input type="text" id="userIdFilter" value={userIdFilter} onChange={(e) => setUserIdFilter(e.target.value)} className={`${getBaseInputClasses()} rounded-xl border-gray-200 h-10`} placeholder="User ID/UUID" />
                                                </div>
                                                <div>
                                                    <label htmlFor="planIdFilter" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center opacity-80">
                                                        <IconTag size={14} className="mr-1.5" /> Plan Reference
                                                    </label>
                                                    <input type="text" id="planIdFilter" value={planIdFilter} onChange={(e) => setPlanIdFilter(e.target.value)} className={`${getBaseInputClasses()} rounded-xl border-gray-200 h-10`} placeholder="Plan UUID" />
                                                </div>
                                                <div>
                                                    <label htmlFor="razorpayOrderIdFilter" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center opacity-80">
                                                        <IconReceipt size={14} className="mr-1.5" /> Payment Reference
                                                    </label>
                                                    <input type="text" id="razorpayOrderIdFilter" value={razorpayOrderIdFilter} onChange={(e) => setRazorpayOrderIdFilter(e.target.value)} className={`${getBaseInputClasses()} rounded-xl border-gray-200 h-10`} placeholder="Razorpay Order/Payment" />
                                                </div>
                                                <div>
                                                    <label htmlFor="createdAtStartFilter" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center opacity-80">
                                                        <IconCalendar size={14} className="mr-1.5" /> From Date
                                                    </label>
                                                    <input type="date" id="createdAtStartFilter" value={createdAtStartFilter} onChange={(e) => setCreatedAtStartFilter(e.target.value)} className={`${getBaseInputClasses()} rounded-xl border-gray-200 h-10`} />
                                                </div>
                                                <div>
                                                    <label htmlFor="createdAtEndFilter" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center opacity-80">
                                                        <IconCalendar size={14} className="mr-1.5" /> To Date
                                                    </label>
                                                    <input type="date" id="createdAtEndFilter" value={createdAtEndFilter} onChange={(e) => setCreatedAtEndFilter(e.target.value)} className={`${getBaseInputClasses()} rounded-xl border-gray-200 h-10`} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-7 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                                            <button onClick={handleApplyFilters} className="bg-slate-900 text-white rounded-xl px-5 py-2 text-sm font-medium shadow-md hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-95 flex items-center">
                                                <IconFilter className="mr-2" size={18} /> Apply Filters
                                            </button>
                                            <button onClick={handleClearFilters} className="bg-white text-slate-600 border border-gray-200 rounded-xl px-5 py-2 text-sm font-medium hover:bg-slate-50 transition-all active:scale-95 flex items-center">
                                                <IconRefresh className="mr-2 opacity-60" size={18} /> Reset
                                            </button>
                                        </div>
                                    </DisclosurePanel>
                                </Transition>
                            </>
                        )}
                    </Disclosure>
                </div>

                {/* Main Content Area */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
                    <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 flex items-center uppercase tracking-wider">
                                Transaction Ledger
                            </h2>
                            <p className="text-sm text-slate-400 mt-0.5 font-medium">
                                {loading ? 'Fetching records...' : transactions.length > 0
                                    ? `Record ${((currentPage - 1) * itemsPerPage) + 1} to ${Math.min(currentPage * itemsPerPage, totalCount)} of ${totalCount}`
                                    : 'No records found matching your criteria'}
                            </p>
                        </div>

                        <div className="flex items-center space-x-3 w-full sm:w-auto">
                            {/* Quick Stats Filter Dropdown */}
                            <Menu as="div" className="relative inline-block text-left w-full sm:w-auto">
                                <MenuButton className="inline-flex items-center justify-between w-full sm:w-44 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 uppercase tracking-widest hover:bg-white transition-all shadow-sm">
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
                                            {(['paid', 'failed', 'refunded'] as const).map((status) => (
                                                <MenuItem key={status}>
                                                    {({ active }) => (
                                                        <button
                                                            onClick={() => {
                                                                setStatusFilter([status]);
                                                                setCurrentPage(1);
                                                                // The useEffect will trigger fetch
                                                            }}
                                                            className={`${active ? 'bg-slate-50 text-slate-900' : 'text-slate-600'} group flex w-full items-center rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors`}
                                                        >
                                                            <div className={`w-2 h-2 rounded-full mr-3 ${status === 'paid' ? 'bg-emerald-500' : status === 'failed' ? 'bg-rose-500' : 'bg-slate-400'}`}></div>
                                                            {status}
                                                        </button>
                                                    )}
                                                </MenuItem>
                                            ))}
                                            <div className="border-t border-gray-50 mt-1 pt-1">
                                                <MenuItem>
                                                    {({ active }) => (
                                                        <button onClick={handleClearFilters} className={`${active ? 'bg-slate-50 text-slate-900' : 'text-slate-500'} group flex w-full items-center rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors`}>
                                                            <IconRefresh size={14} className="mr-3 opacity-40" />
                                                            Clear All
                                                        </button>
                                                    )}
                                                </MenuItem>
                                            </div>
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
                                <p className="mt-4 text-sm font-bold text-slate-400 animate-pulse tracking-widest uppercase">Initializing Records...</p>
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
                                <div className="p-5 bg-slate-50 rounded-full mb-5">
                                    <IconReceipt size={48} className="text-slate-200" />
                                </div>
                                <p className="text-slate-600 text-lg font-bold uppercase tracking-tight">No Transactions Recorded</p>
                                <p className="text-slate-400 mt-2 max-w-xs mx-auto text-sm font-medium">We couldn't find any transaction history matching your current filter set.</p>
                                <button onClick={handleClearFilters} className="mt-8 inline-flex items-center px-6 py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl uppercase tracking-[0.15em] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-200">
                                    <IconRefresh size={16} className="mr-2" /> Reset Ledger
                                </button>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-50">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-6 py-4 text-left text-[11px] font-medium text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">Receipt ID</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-medium text-slate-500 uppercase tracking-[0.2em]">Customer Entity</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-medium text-slate-500 uppercase tracking-[0.2em]">Asset/Plan</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-medium text-slate-500 uppercase tracking-[0.2em]">Financials</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-medium text-slate-500 uppercase tracking-[0.2em]">Status</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-medium text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">Timeline</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-50">
                                    {transactions.map((transaction) => (
                                        <Fragment key={transaction.transaction_id}>
                                            <tr className="hover:bg-slate-50/30 transition-colors group">
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-mono text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100 uppercase group-hover:bg-white group-hover:border-slate-200 transition-all">
                                                            #{transaction.transaction_id?.substring(0, 8) || ''}
                                                        </span>
                                                        <button onClick={() => copyToClipboard(transaction.transaction_id)} title="Copy Full ID" className="text-slate-300 hover:text-slate-600 transition-colors">
                                                            <IconCopy size={12} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <button
                                                            onClick={() => toggleTransactionDetails(transaction.transaction_id)}
                                                            className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors text-left flex items-center"
                                                        >
                                                            {transaction.customer_name}
                                                            {expandedTransactionId === transaction.transaction_id ?
                                                                <IconChevronUp size={14} className="ml-1 opacity-40 translate-y-px" /> :
                                                                <IconChevronDown size={14} className="ml-1 opacity-40 translate-y-px" />
                                                            }
                                                        </button>
                                                        <span className="text-[11px] font-medium text-slate-400 mt-0.5 tracking-tight">{transaction.customer_email}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-slate-700">{transaction.plan_name}</span>
                                                        <span className="text-[10px] font-mono font-medium text-slate-300 mt-1 uppercase tracking-tighter">REF: {transaction.plan_id?.substring(0, 8) || ''}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-slate-900">₹{transaction.amount.toLocaleString()}</div>
                                                    <div className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5 opacity-60">Inclusive of Tax</div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <span className={`${getStatusBadgeClasses(transaction.status)} inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm`}>
                                                        {getStatusIcon(transaction.status)}
                                                        <span className="ml-1.5">{transaction.status}</span>
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-medium text-slate-700">{formatTimestamp(transaction.created_at).split(',')[0]}</span>
                                                        <span className="text-[10px] font-medium text-slate-400 mt-0.5 uppercase tracking-wide">{formatTimestamp(transaction.created_at).split(',')[1]}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedTransactionId === transaction.transaction_id && (
                                                <tr>
                                                    <td colSpan={6} className="px-6 pb-6 pt-0">
                                                        <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-6 grid grid-cols-1 md:grid-cols-3 gap-8 shadow-inner">
                                                            <div className="space-y-4">
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Gateway Internal Identifiers</p>
                                                                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-3">
                                                                    <div>
                                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Razorpay Order ID</label>
                                                                        <button onClick={() => copyToClipboard(transaction.razorpay_order_id || '')} className="font-mono text-[10px] text-slate-600 hover:text-blue-600 break-all text-left">
                                                                            {transaction.razorpay_order_id || 'NOT_ASSIGNED'} <IconCopy size={10} className="inline ml-1 opacity-40" />
                                                                        </button>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Razorpay Payment ID</label>
                                                                        <button onClick={() => copyToClipboard(transaction.razorpay_payment_id || '')} className="font-mono text-[10px] text-slate-600 hover:text-blue-600 break-all text-left">
                                                                            {transaction.razorpay_payment_id || 'NOT_PROCESSED'} <IconCopy size={10} className="inline ml-1 opacity-40" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-4">
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Customer Profile Info</p>
                                                                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-3">
                                                                    <div>
                                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">System UUID</label>
                                                                        <button onClick={() => copyToClipboard(transaction.customer_user_id)} className="font-mono text-[10px] text-slate-600 hover:text-blue-600 break-all text-left">
                                                                            {transaction.customer_user_id} <IconCopy size={10} className="inline ml-1 opacity-40" />
                                                                        </button>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Contact Metadata</label>
                                                                        <p className="text-xs font-bold text-slate-700">{transaction.customer_phone || 'PHONE_NOT_RECOGNIZED'}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-4">
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Processing Audit Trail</p>
                                                                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-3">
                                                                    <div>
                                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Last Updated Snapshot</label>
                                                                        <p className="text-xs font-bold text-slate-700 font-mono uppercase">{formatTimestamp(transaction.updated_at)}</p>
                                                                    </div>
                                                                    {transaction.error_message && (
                                                                        <div className="bg-rose-50 p-2 rounded-lg border border-rose-100">
                                                                            <label className="text-[9px] font-black text-rose-600 uppercase tracking-widest block mb-1">Gateway Error Log</label>
                                                                            <p className="text-[10px] font-bold text-rose-800 line-clamp-2" title={transaction.error_message}>{transaction.error_message}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {totalCount > itemsPerPage && (
                        <div className="flex items-center justify-between border-t border-gray-50 bg-white px-6 py-5">
                            <div className="hidden sm:block">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    Displaying Page <span className="text-slate-900 mx-1">{currentPage}</span> of <span className="text-slate-900 mx-1">{totalPages}</span>
                                </p>
                            </div>
                            <div className="flex space-x-2 w-full sm:w-auto">
                                <button
                                    onClick={() => {
                                        const newPage = Math.max(currentPage - 1, 1);
                                        setCurrentPage(newPage);
                                        // fetchTransactions handled by useEffect
                                    }}
                                    disabled={currentPage === 1 || loading}
                                    className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                                >
                                    <IconChevronLeft size={16} className="mr-1" /> Prev
                                </button>
                                <button
                                    onClick={() => {
                                        const newPage = Math.min(currentPage + 1, totalPages);
                                        setCurrentPage(newPage);
                                    }}
                                    disabled={currentPage === totalPages || loading}
                                    className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 bg-slate-900 border border-slate-900 rounded-xl text-xs font-black uppercase tracking-widest text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-slate-100"
                                >
                                    Next <IconChevronRight size={16} className="ml-1" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TransactionsPage;