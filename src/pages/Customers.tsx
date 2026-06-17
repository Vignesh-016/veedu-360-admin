import { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    IconSearch, IconX, IconChevronLeft, IconChevronRight,
    IconUsers, IconUserCheck, IconCalendarEvent, IconUsersGroup
} from '@tabler/icons-react';
import api from '../lib/supabaseClient';
import { CustomerFullDetailsAdmin, UpdateCustomerProfileDetailsAdminParams, CustomerSearchResultAdmin } from '../lib/types';
import CustomerEditModal from '../components/CustomerEditModal';
import JsonEditorModal from '../components/JsonEditorModal';
import { useNotification } from '../components/NotificationProvider';
import { getSecondaryButtonClasses } from '../lib/twUtils';
import { Json } from '../database.types';
import CustomerList from '../components/customers/CustomerList';
import { DashboardStats } from '../lib/types';

function Customers() {
    const [customers, setCustomers] = useState<CustomerSearchResultAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isJsonEditorOpen, setIsJsonEditorOpen] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [loadingCustomerId, setLoadingCustomerId] = useState<string | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerFullDetailsAdmin | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);

    const { showSuccessNotification, showErrorNotification } = useNotification();

    const fetchCustomers = useCallback(async (term: string, page: number) => {
        setLoading(true);
        setError(null);
        const offset = (page - 1) * itemsPerPage;
        try {
            const { data, error: fetchError } = await api.searchCustomers(term, undefined, offset, itemsPerPage);
            if (fetchError) {
                throw new Error(typeof fetchError === 'string' ? fetchError : fetchError.message);
            }
            setCustomers(data || []);
            if (data && data.length > 0 && data[0].total_count !== undefined) {
                setTotalCount(data[0].total_count);
            } else if (page === 1) {
                setTotalCount(data ? data.length : 0);
            } else {
                setTotalCount(offset + (data ? data.length : 0));
            }
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to fetch customers';
            setError(errMsg);
            showErrorNotification("Error Fetching Customers", errMsg);
            setCustomers([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    }, [itemsPerPage, showErrorNotification]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const { data, error } = await api.getDashboardStatsAdmin();
            if (error) throw error;
            setStats(data);
        } catch (err) {
            console.error("Error fetching stats:", err);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCustomers(searchTerm, currentPage);
        fetchStats();
    }, [searchTerm, currentPage, fetchCustomers, fetchStats]);

    const handleSearchSubmit = () => {
        setCurrentPage(1);
        fetchCustomers(searchTerm, 1);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setCurrentPage(1);
        fetchCustomers('', 1);
    };

    const fetchAndPrepareModal = async (customerId: string, modalType: 'profileEdit' | 'visitsEdit') => {
        setDetailsLoading(true);
        setLoadingCustomerId(customerId);
        try {
            const { data, error: fetchError } = await api.getCustomerFullDetails(customerId);
            if (fetchError) throw new Error(typeof fetchError === 'string' ? fetchError : fetchError.message);
            if (!data) throw new Error("Customer details not found.");
            setSelectedCustomer(data);
            if (modalType === 'profileEdit') setIsJsonEditorOpen(true);
            else if (modalType === 'visitsEdit') setIsEditModalOpen(true);
        } catch (err) {
            showErrorNotification("Error Loading Details", err instanceof Error ? err.message : `Failed to load details for customer ${customerId}`);
            setSelectedCustomer(null);
        } finally {
            setDetailsLoading(false);
            setLoadingCustomerId(null);
        }
    };

    const handleEditCustomerVisits = (customer: CustomerSearchResultAdmin) => fetchAndPrepareModal(customer.user_id, 'visitsEdit');
    const handleEditProfileDetails = (customer: CustomerSearchResultAdmin) => fetchAndPrepareModal(customer.user_id, 'profileEdit');
    const handleEditModalClose = () => { setIsEditModalOpen(false); setSelectedCustomer(null); };
    const handleJsonEditorClose = () => { setIsJsonEditorOpen(false); setSelectedCustomer(null); };

    const handleJsonEditorSave = async (updatedJson: Json) => {
        if (!selectedCustomer) return;
        setError(null);
        const params: UpdateCustomerProfileDetailsAdminParams = { p_customer_user_id: selectedCustomer.user_id, p_profile_details: updatedJson };
        try {
            const { error: updateError } = await api.updateCustomerProfileDetails(params);
            if (updateError) throw new Error(typeof updateError === 'string' ? updateError : updateError.message);
            showSuccessNotification("Profile Updated", "Customer profile details updated successfully!");
            handleJsonEditorClose();
            fetchCustomers(searchTerm, currentPage);
        } catch (err) {
            showErrorNotification("Update Error", err instanceof Error ? err.message : 'Failed to update profile details');
        }
    };

    const handleNextPage = () => {
        const newPage = currentPage + 1;
        setCurrentPage(newPage);
    };

    const handlePrevPage = () => {
        const newPage = Math.max(currentPage - 1, 1);
        setCurrentPage(newPage);
    };

    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const companyName = import.meta.env.VITE_COMPANY_NAME;

    return (
        <>
            <Helmet><title>Customers | {companyName}</title></Helmet>
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    {error && (<div className="mb-6 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-md shadow" role="alert"><p className="font-bold">Error</p><p>{error}</p></div>)}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Customers</h1>
                            <p className="mt-1 text-sm text-gray-500 font-normal">View and manage customer accounts.</p>
                        </div>
                    </div>

                    {/* Summary Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md">
                            <div className="p-3 rounded-lg bg-blue-50 text-blue-600 mr-4">
                                <IconUsersGroup size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-normal text-gray-500">Registered Users</p>
                                <p className="text-2xl font-bold text-gray-900 leading-none mt-1">
                                    {statsLoading ? '...' : stats?.customers?.total_registered_users || 0}
                                </p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md">
                            <div className="p-3 rounded-lg bg-teal-50 text-teal-600 mr-4">
                                <IconUserCheck size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-normal text-gray-500">Active Profiles</p>
                                <p className="text-2xl font-bold text-gray-900 leading-none mt-1">
                                    {statsLoading ? '...' : stats?.customers?.customers_with_profiles || 0}
                                </p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md">
                            <div className="p-3 rounded-lg bg-purple-50 text-purple-600 mr-4">
                                <IconCalendarEvent size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-normal text-gray-500">Active Visits</p>
                                <p className="text-2xl font-bold text-gray-900 leading-none mt-1">
                                    {statsLoading ? '...' : stats?.customers?.customers_with_active_visits || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-8 p-1">
                        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1 sr-only">Search Customers</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none group-focus-within:text-blue-500 transition-colors">
                                <IconSearch className="h-4.5 w-4.5 text-gray-400 group-focus-within:text-blue-500" />
                            </div>
                            <input
                                type="text"
                                id="search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                                className={`pl-11 pr-10 py-3 block w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-all duration-200 hover:border-gray-300 bg-white`}
                                placeholder="Search by name, email, or phone..."
                            />
                            {searchTerm && (
                                <button
                                    onClick={handleClearSearch}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center focus:outline-none focus:text-gray-600 text-gray-400 hover:text-gray-500"
                                    title='Clear search'
                                >
                                    <IconX className="h-4.5 w-4.5" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-lg font-medium text-gray-800 flex items-center"><IconUsers size={20} className="mr-2 text-gray-400" /> Customer List</h2>
                            <p className="text-sm text-gray-500 mt-1 font-normal">
                                {customers.length > 0 ? `Showing ${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, totalCount)} of ${totalCount} customers` : 'No customers found matching your criteria'}
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <CustomerList
                                customers={customers}
                                loading={loading && customers.length === 0}
                                detailsLoading={detailsLoading}
                                loadingCustomerId={loadingCustomerId}
                                onEditCustomerVisits={handleEditCustomerVisits}
                                onEditProfileDetails={handleEditProfileDetails}
                            />
                        </div>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-3 py-2 sm:px-4 rounded-b-xl">
                                <div><p className="text-xs text-gray-700">Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span></p></div>
                                <div className="flex gap-1">
                                    <button onClick={handlePrevPage} disabled={currentPage === 1 || loading} className={`${getSecondaryButtonClasses()} !px-2 !py-1 text-xs`}><IconChevronLeft size={14} className="mr-0.5" /> Prev</button>
                                    <button onClick={handleNextPage} disabled={currentPage === totalPages || loading} className={`${getSecondaryButtonClasses()} !px-2 !py-1 text-xs`}>Next <IconChevronRight size={14} className="ml-0.5" /></button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <CustomerEditModal isOpen={isEditModalOpen} onClose={handleEditModalClose} customer={selectedCustomer} onSuccess={() => fetchCustomers(searchTerm, currentPage)} />
            <JsonEditorModal isOpen={isJsonEditorOpen} onClose={handleJsonEditorClose} initialJson={selectedCustomer?.profile_details} onSave={handleJsonEditorSave} title={`Edit Profile Details (${selectedCustomer?.full_name || 'Customer'})`} keyPlaceholder="e.g., Marital Status" valuePlaceholder="" predefinedKeys={["Job", "Gender", "Marital Status", "Religion", "Caste", "Budget", "Location", "Aadhar No.", "PAN No."]} />
        </>
    );
}

export default Customers;