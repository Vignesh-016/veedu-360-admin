import { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    IconChevronLeft, IconChevronRight, IconReceipt
} from '@tabler/icons-react';

import api from '../lib/supabaseClient';
import { ListRentRecordsAdminParams, RentRecordAdminSummary } from '../lib/types';
import { useNotification } from '../components/NotificationProvider';
import { getSecondaryButtonClasses } from '../lib/twUtils';
import PaymentFilters from '../components/rent-payments/PaymentFilters';
import PaymentList from '../components/rent-payments/PaymentList';

function RentPaymentsPage() {
    const [payments, setPayments] = useState<RentRecordAdminSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { showErrorNotification } = useNotification();

    // Filter state
    const [rentPropertyIdFilter, setRentPropertyIdFilter] = useState<string>('');
    const [paidByUserIdFilter, setPaidByUserIdFilter] = useState<string>('');
    const [paymentDateStartFilter, setPaymentDateStartFilter] = useState<string>('');
    const [paymentDateEndFilter, setPaymentDateEndFilter] = useState<string>('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);
    const [totalCount, setTotalCount] = useState(0);

    const fetchRentPayments = useCallback(async (page: number) => {
        setLoading(true);
        setError(null);
        const offset = (page - 1) * itemsPerPage;

        const params: ListRentRecordsAdminParams = {
            p_property_id_filter: rentPropertyIdFilter || undefined,
            p_tenant_user_id_filter: paidByUserIdFilter || undefined,
            p_due_date_start: paymentDateStartFilter || undefined,
            p_due_date_end: paymentDateEndFilter || undefined,
            p_offset: offset,
            p_limit: itemsPerPage,
        };

        try {
            const { data, error: fetchError } = await api.listRentRecordsAdmin(params);
            if (fetchError) throw fetchError;

            setPayments(data || []);
            if (data && data.length > 0 && data[0].total_count !== undefined) {
                setTotalCount(data[0].total_count);
            } else if (page === 1) {
                setTotalCount(data ? data.length : 0);
            } else {
                setTotalCount(offset + (data ? data.length : 0));
            }
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to fetch payment records';
            setError(errMsg);
            showErrorNotification("Error Fetching Data", errMsg);
            setPayments([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    }, [
        itemsPerPage, rentPropertyIdFilter, paidByUserIdFilter,
        paymentDateStartFilter, paymentDateEndFilter, showErrorNotification
    ]);

    useEffect(() => {
        fetchRentPayments(currentPage);
    }, [currentPage, fetchRentPayments]);

    const handleApplyFilters = () => {
        setCurrentPage(1);
        fetchRentPayments(1);
    };

    const handleClearFilters = () => {
        setRentPropertyIdFilter('');
        setPaidByUserIdFilter('');
        setPaymentDateStartFilter('');
        setPaymentDateEndFilter('');
        if (currentPage !== 1) {
            setCurrentPage(1);
        } else {
            fetchRentPayments(1);
        }
    };

    const handleNextPage = () => setCurrentPage(prev => prev + 1);
    const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    const filterSetters = {
        setRentPropertyIdFilter,
        setPaidByUserIdFilter,
        setPaymentDateStartFilter,
        setPaymentDateEndFilter,
    };

    const currentFilters = {
        rentPropertyIdFilter,
        paidByUserIdFilter,
        paymentDateStartFilter,
        paymentDateEndFilter,
    };
    const companyName = import.meta.env.VITE_COMPANY_NAME;

    return (
        <>
            <Helmet>
                <title>Rent Payments Overview | {companyName}</title>
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
                            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Rent Payments Overview</h1>
                            <p className="mt-1 text-sm text-gray-500">View overview of rent records and their payment status.</p>
                        </div>
                    </div>

                    <PaymentFilters
                        filters={currentFilters}
                        setters={filterSetters}
                        onApplyFilters={handleApplyFilters}
                        onClearFilters={handleClearFilters}
                    />

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                <IconReceipt size={20} className='mr-2 text-gray-500' /> Payment Records List
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {payments.length > 0
                                    ? `Showing ${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, totalCount)} of ${totalCount} records`
                                    : 'No payment records found matching your criteria.'}
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <PaymentList
                                payments={payments}
                                loading={loading && payments.length === 0}
                            />
                        </div>

                        {totalCount > itemsPerPage && (
                            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-b-xl">
                                <div>
                                    <p className="text-sm text-gray-700">Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span></p>
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
                </div>
            </div>
        </>
    );
}

export default RentPaymentsPage;