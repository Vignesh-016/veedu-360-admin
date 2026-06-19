import { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { IconPlus, IconChevronLeft, IconChevronRight, IconReceipt } from '@tabler/icons-react';

import LoadingSpinner from '../components/LoadingSpinner';
import RentRecordFormModal from '../components/RentRecordFormModal';
import RentRecordDetailsModal from '../components/RentRecordDetailsModal';
import api from '../lib/supabaseClient';
import { RentStatus, RentRecordAdminSummary, ListRentRecordsAdminParams } from '../lib/types';
import { useNotification } from '../components/NotificationProvider';
import { getPrimaryButtonClasses, getSecondaryButtonClasses } from '../lib/twUtils';
import RentRecordFilters from '../components/rent-records/RentRecordFilters';
import RentRecordList from '../components/rent-records/RentRecordList';

function RentRecordsPage() {
    const [records, setRecords] = useState<RentRecordAdminSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<RentRecordAdminSummary | null>(null);
    const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
    const { showSuccessNotification, showErrorNotification } = useNotification();

    // Filter state
    const [propertyIdFilter, setPropertyIdFilter] = useState<string>('');
    const [tenantIdFilter, setTenantIdFilter] = useState<string>('');
    const [landlordIdFilter, setLandlordIdFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<RentStatus | undefined>(undefined);
    const [dueDateStartFilter, setDueDateStartFilter] = useState<string>('');
    const [dueDateEndFilter, setDueDateEndFilter] = useState<string>('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const fetchRentRecords = useCallback(async (page: number = currentPage) => {
        setLoading(true);
        setError(null);
        const offset = (page - 1) * itemsPerPage;

        const params: ListRentRecordsAdminParams = {
            p_property_id_filter: propertyIdFilter || undefined,
            p_tenant_user_id_filter: tenantIdFilter || undefined,
            p_landlord_user_id_filter: landlordIdFilter || undefined,
            p_status_filter: statusFilter,
            p_due_date_start: dueDateStartFilter || undefined,
            p_due_date_end: dueDateEndFilter || undefined,
            p_offset: offset,
            p_limit: itemsPerPage
        };

        try {
            const { data, error: fetchError } = await api.listRentRecordsAdmin(params);
            if (fetchError) throw fetchError;

            setRecords(data || []);
            if (data && data.length > 0 && data[0].total_count !== undefined) {
                setTotalCount(data[0].total_count);
            } else if (page === 1) {
                setTotalCount(data ? data.length : 0);
            } else {
                setTotalCount(offset + (data ? data.length : 0));
            }
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to fetch rent records';
            setError(errMsg);
            showErrorNotification("Error Fetching Records", errMsg);
            setRecords([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    }, [
        currentPage, itemsPerPage, propertyIdFilter, tenantIdFilter, landlordIdFilter,
        statusFilter, dueDateStartFilter, dueDateEndFilter, showErrorNotification
    ]);

    useEffect(() => {
        fetchRentRecords(currentPage);
    }, [currentPage, fetchRentRecords]);

    const handleApplyFilters = () => {
        setCurrentPage(1);
        fetchRentRecords(1);
    };

    const handleClearFilters = () => {
        setPropertyIdFilter('');
        setTenantIdFilter('');
        setLandlordIdFilter('');
        setStatusFilter(undefined);
        setDueDateStartFilter('');
        setDueDateEndFilter('');
        if (currentPage !== 1) {
            setCurrentPage(1);
        } else {
            fetchRentRecords(1);
        }
    };

    const handleAddRecord = () => {
        setSelectedRecord(null);
        setIsFormModalOpen(true);
    };

    const handleEditRecord = (record: RentRecordAdminSummary) => {
        setSelectedRecord(record);
        setIsFormModalOpen(true);
    };

    const handleViewDetails = (record: RentRecordAdminSummary) => {
        setSelectedRecord(record);
        setIsDetailsModalOpen(true);
    };

    const handleFormModalClose = () => {
        setIsFormModalOpen(false);
        setSelectedRecord(null);
    };

    const handleDetailsModalClose = () => {
        setIsDetailsModalOpen(false);
        setSelectedRecord(null);
    };

    const handleDeleteRecord = async (recordId: string) => {
        if (window.confirm('Are you sure you want to delete this rent record and all associated payments? This cannot be undone.')) {
            setDeletingRecordId(recordId);
            try {
                const { error: deleteError } = await api.deleteRentRecordAdmin(recordId);
                if (deleteError) throw deleteError;
                showSuccessNotification("Rent Record Deleted", "Record and payments deleted successfully.");
                fetchRentRecords(currentPage);
            } catch (err) {
                const errMsg = err instanceof Error ? err.message : 'Failed to delete rent record.';
                setError(errMsg);
                showErrorNotification("Deletion Error", errMsg);
            } finally {
                setDeletingRecordId(null);
            }
        }
    };

    const handleNextPage = () => setCurrentPage(prev => prev + 1);
    const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    const filterSetters = {
        setPropertyIdFilter,
        setTenantIdFilter,
        setLandlordIdFilter,
        setStatusFilter,
        setDueDateStartFilter,
        setDueDateEndFilter,
    };

    const currentFilters = {
        propertyIdFilter,
        tenantIdFilter,
        landlordIdFilter,
        statusFilter,
        dueDateStartFilter,
        dueDateEndFilter,
    };
    const companyName = import.meta.env.VITE_COMPANY_NAME;

    return (
        <>
            <Helmet>
                <title>{`Rent Records | ${companyName}`}</title>
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
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Rent Records</h1>
                            <p className="mt-1 text-sm text-gray-500 font-normal">Manage rent payments and dues.</p>
                        </div>
                        <button onClick={handleAddRecord} className={`${getPrimaryButtonClasses()} font-medium`}>
                            <IconPlus className="mr-2" size={18} stroke={2} />
                            Add New Rent Record
                        </button>
                    </div>

                    <RentRecordFilters
                        filters={currentFilters}
                        setters={filterSetters}
                        onApplyFilters={handleApplyFilters}
                        onClearFilters={handleClearFilters}
                    />

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-lg font-medium text-gray-800 flex items-center"><IconReceipt size={20} className='mr-2 text-gray-500' /> Rent Record List</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {records.length > 0
                                    ? `Showing ${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, totalCount)} of ${totalCount} records`
                                    : 'No rent records found matching your criteria.'}
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            {loading && records.length === 0 ? (
                                <div className="p-10 flex justify-center"><LoadingSpinner /></div>
                            ) : (
                                <RentRecordList
                                    records={records}
                                    loading={loading}
                                    deletingRecordId={deletingRecordId}
                                    onEditRecord={handleEditRecord}
                                    onViewDetails={handleViewDetails}
                                    onDeleteRecord={handleDeleteRecord}
                                />
                            )}
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

            <RentRecordFormModal
                isOpen={isFormModalOpen}
                onClose={handleFormModalClose}
                record={selectedRecord}
                onSuccess={() => fetchRentRecords(currentPage)}
            />
            <RentRecordDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={handleDetailsModalClose}
                recordId={selectedRecord?.rent_record_id ?? null}
                onSuccess={() => fetchRentRecords(currentPage)}
            />
        </>
    );
}

export default RentRecordsPage;