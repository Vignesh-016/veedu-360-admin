import { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    IconTrash, IconSearch, IconX, IconCopy, IconUserPlus,
    IconChevronLeft, IconChevronRight, IconEdit, IconUsers,
    IconCircleCheck, IconCircleX, IconLoader
} from '@tabler/icons-react';

import LoadingSpinner from '../components/LoadingSpinner';
import api from '../lib/supabaseClient';
import { AdminUserSummary, CustomerSearchResultAdmin } from '../lib/types';
import { useNotification } from '../components/NotificationProvider';
import { useAuth } from '../lib/AuthContext';
import { Navigate } from 'react-router-dom';
import { copyToClipboard } from '../lib/utils';
import {
    getPrimaryButtonClasses, getSecondaryButtonClasses, getBaseInputClasses,
    getBooleanBadgeClasses
} from '../lib/twUtils';
import AdminFormModal from '../components/AdminFormModal';

function AdminsPage() {
    const { isSuperAdmin, loading: authLoading } = useAuth();
    const [admins, setAdmins] = useState<AdminUserSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Admin Search
    const [addAdminSearchTerm, setAddAdminSearchTerm] = useState('');
    const [addAdminSearchResults, setAddAdminSearchResults] = useState<CustomerSearchResultAdmin[]>([]);
    const [addAdminSearchLoading, setAddAdminSearchLoading] = useState(false);

    // Modal State for AdminFormModal
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [adminToEditForModal, setAdminToEditForModal] = useState<AdminUserSummary | null>(null);
    const [userToMakeAdminForModal, setUserToMakeAdminForModal] = useState<CustomerSearchResultAdmin | null>(null);

    // Action Loaders
    const [removingAdminId, setRemovingAdminId] = useState<string | null>(null);
    const [togglingActiveAdminId, setTogglingActiveAdminId] = useState<string | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const { showSuccessNotification, showErrorNotification } = useNotification();

    const fetchAdmins = useCallback(async (page: number = currentPage) => {
        setLoading(true);
        setError(null);
        const offset = (page - 1) * itemsPerPage;
        try {
            const { data, error: fetchError } = await api.listAdmins(undefined, undefined, undefined, offset, itemsPerPage);
            if (fetchError) throw fetchError;
            setAdmins(data || []);
            if (data && data.length > 0 && data[0].total_count !== undefined) {
                setTotalCount(data[0].total_count);
            } else if (page === 1) {
                setTotalCount(data ? data.length : 0);
            }
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to fetch admins';
            setError(errMsg);
            showErrorNotification("Error Fetching Admins", errMsg);
        } finally {
            setLoading(false);
        }
    }, [currentPage, showErrorNotification]);

    useEffect(() => {
        if (isSuperAdmin) {
            fetchAdmins(currentPage);
        } else if (!authLoading) {
            setLoading(false);
        }
    }, [isSuperAdmin, authLoading, fetchAdmins]);


    const handleAddAdminSearch = async () => {
        if (!addAdminSearchTerm.trim()) {
            setAddAdminSearchResults([]);
            return;
        }
        setAddAdminSearchLoading(true);
        try {
            const { data, error: searchError } = await api.searchCustomers(addAdminSearchTerm, undefined, 0, 5);
            if (searchError) throw searchError;

            const currentAdminIds = new Set(admins.map(a => a.user_id));
            const filteredResults = (data || []).filter(user => !currentAdminIds.has(user.user_id));
            setAddAdminSearchResults(filteredResults);

            if (filteredResults.length === 0 && data && data.length > 0) {
                showErrorNotification("User Found", "This user is already an admin or no new users match.");
            } else if (filteredResults.length === 0) {
                showErrorNotification("Not Found", "No non-admin users found matching your search.");
            }
        } catch (err) {
            showErrorNotification("Search Error", err instanceof Error ? err.message : 'Search failed');
        } finally {
            setAddAdminSearchLoading(false);
        }
    };

    const handleClearAddAdminSearch = () => {
        setAddAdminSearchTerm('');
        setAddAdminSearchResults([]);
    };

    const openModalForNewAdmin = (user: CustomerSearchResultAdmin) => {
        setUserToMakeAdminForModal(user);
        setAdminToEditForModal(null);
        setIsAddEditModalOpen(true);
    };

    const openModalForEditAdmin = (admin: AdminUserSummary) => {
        setAdminToEditForModal(admin);
        setUserToMakeAdminForModal(null);
        setIsAddEditModalOpen(true);
    };

    const handleModalClose = () => {
        setIsAddEditModalOpen(false);
        setAdminToEditForModal(null);
        setUserToMakeAdminForModal(null);
    };

    const handleModalSuccess = () => {
        const wasEditing = !!adminToEditForModal;
        fetchAdmins(wasEditing ? currentPage : 1);
        if (!wasEditing) setCurrentPage(1);
        handleClearAddAdminSearch();
    };

    const handleRemoveAllRoles = async (adminId: string, adminName: string) => {
        if (window.confirm(`Are you sure you want to remove ALL admin roles for ${adminName}? This will remove their admin access.`)) {
            setRemovingAdminId(adminId);
            try {
                const { error } = await api.setAdminRoles({ p_user_id: adminId, p_roles: [] });
                if (error) throw error;
                showSuccessNotification("Admin Roles Removed", `All roles removed for ${adminName}.`);
                fetchAdmins(currentPage);
            } catch (err) {
                showErrorNotification("Removal Failed", err instanceof Error ? err.message : "Could not remove admin roles.");
            } finally {
                setRemovingAdminId(null);
            }
        }
    };

    const handleToggleActiveStatus = async (admin: AdminUserSummary) => {
        setTogglingActiveAdminId(admin.user_id);
        try {
            if (admin.is_active) {
                const { error } = await api.deactivateAdmin(admin.user_id);
                if (error) throw error;
                showSuccessNotification("Admin Deactivated", `${admin.full_name || admin.email} deactivated.`);
            } else {
                const { error } = await api.activateAdmin(admin.user_id);
                if (error) throw error;
                showSuccessNotification("Admin Activated", `${admin.full_name || admin.email} activated.`);
            }
            fetchAdmins(currentPage);
        } catch (err) {
            showErrorNotification("Status Update Failed", err instanceof Error ? err.message : "Could not update status.");
        } finally {
            setTogglingActiveAdminId(null);
        }
    };


    const handleNextPage = () => setCurrentPage(prev => prev + 1);
    const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    if (authLoading) return <div className="flex items-center justify-center h-screen"><LoadingSpinner /></div>;
    if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;
    const companyName = import.meta.env.VITE_COMPANY_NAME || "Admin Panel";

    return (
        <>
            <Helmet><title>{`Manage Admins | ${companyName}`}</title></Helmet>
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    {error && <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm animate-fadeIn"><p className="font-bold">Error</p><p>{error}</p></div>}

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div><h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Manage Admins</h1><p className="mt-1 text-sm text-gray-500">Add, edit, or remove admin user roles and details.</p></div>
                    </div>

                    <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center"><IconUserPlus className="mr-2 text-gray-500" size={20} /> Add New Admin by Searching Users</h2>
                        <div className="relative flex items-center gap-2">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><IconSearch className="h-4 w-4 text-gray-400" /></div>
                            <input type="text" value={addAdminSearchTerm} onChange={(e) => setAddAdminSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddAdminSearch()} className={`flex-grow pl-10 ${getBaseInputClasses()}`} placeholder="Search users by name, email, or phone..." disabled={addAdminSearchLoading} />
                            {addAdminSearchTerm && !addAdminSearchLoading && <button onClick={handleClearAddAdminSearch} className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none" title='Clear search'><IconX className="h-4 w-4" /></button>}
                            {addAdminSearchLoading && <div className="p-2"><LoadingSpinner size={16} /></div>}
                            <button onClick={handleAddAdminSearch} className={getSecondaryButtonClasses()} disabled={addAdminSearchLoading || !addAdminSearchTerm.trim()}>Search</button>
                        </div>
                        {addAdminSearchResults.length > 0 && (
                            <ul className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md divide-y divide-gray-200">
                                {addAdminSearchResults.map((user) => (
                                    <li key={user.user_id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 text-sm">
                                        <div><span className="font-medium text-gray-800">{user.full_name || user.email}</span><span className="text-gray-500 ml-2">({user.email}) {user.phone && `| +${user.phone}`}</span></div>
                                        <button onClick={() => openModalForNewAdmin(user)} className={getPrimaryButtonClasses() + " px-3 py-1 text-xs"}>Assign Roles</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {addAdminSearchResults.length === 0 && addAdminSearchTerm && !addAdminSearchLoading && <p className="mt-2 text-sm text-gray-500 italic">No non-admin users found matching your search.</p>}
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md">
                        <div className="p-6 border-b border-gray-100"><h2 className="text-lg font-semibold text-gray-800 flex items-center"><IconUsers className='mr-2 text-gray-500' /> Current Admins</h2><p className="text-sm text-gray-500 mt-1">{totalCount > 0 ? `Showing ${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, totalCount)} of ${totalCount} admins` : 'No admins found.'}</p></div>
                        <div className="overflow-x-auto">
                            {loading ? <div className="p-10 flex justify-center"><LoadingSpinner /></div> : admins.length === 0 ? <div className="p-10 text-center text-gray-500">No admins configured.</div> : (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pincodes</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {admins.map((admin) => (
                                            <tr key={admin.user_id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className="font-medium text-gray-900">{admin.full_name || admin.email}</span>
                                                    <span className="block text-xs text-gray-500">{admin.email} {admin.phone && `| +${admin.phone}`}</span>
                                                    <span className="block text-xs text-gray-500 cursor-pointer hover:text-gray-700" onClick={() => copyToClipboard(admin.user_id)} title="Click to copy User ID">{admin.user_id.substring(0, 8)}... <IconCopy className="inline-block ml-1 h-3 w-3" /></span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                                                    <div className="flex flex-wrap gap-1">
                                                        {admin.roles && admin.roles.length > 0 ? admin.roles.map(role => (
                                                            <span key={role} className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-200 text-gray-700 border border-gray-300">{role.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                                        )) : <span className="text-gray-400 italic">No roles</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{admin.served_pincodes && admin.served_pincodes.length > 0 ? admin.served_pincodes.join(', ') : <span className="text-gray-400 italic">N/A</span>}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                    <span className={getBooleanBadgeClasses(admin.is_active)}>{admin.is_active ? 'Active' : 'Inactive'}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex space-x-1 justify-end">
                                                        <button onClick={() => openModalForEditAdmin(admin)} className={`${getSecondaryButtonClasses()} p-1.5`} title="Edit Roles & Details"><IconEdit size={16} /></button>
                                                        <button onClick={() => handleToggleActiveStatus(admin)} className={`${getSecondaryButtonClasses()} p-1.5`} title={admin.is_active ? "Deactivate Admin" : "Activate Admin"} disabled={togglingActiveAdminId === admin.user_id}>
                                                            {togglingActiveAdminId === admin.user_id ? <IconLoader size={16} className="animate-spin" /> : (admin.is_active ? <IconCircleX size={16} className="text-red-500" /> : <IconCircleCheck size={16} className="text-green-500" />)}
                                                        </button>
                                                        <button onClick={() => handleRemoveAllRoles(admin.user_id, admin.full_name || admin.email)} className={`${getSecondaryButtonClasses()} border-red-300 text-red-600 hover:bg-red-50 p-1.5`} title="Remove All Roles" disabled={removingAdminId === admin.user_id}>
                                                            {removingAdminId === admin.user_id ? <IconLoader size={16} className="animate-spin" /> : <IconTrash size={16} />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6"><p className="text-sm text-gray-700">Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span></p><div className="flex gap-2"><button onClick={handlePrevPage} disabled={currentPage === 1 || loading} className={getSecondaryButtonClasses()}><IconChevronLeft size={16} className="mr-1" /> Previous</button><button onClick={handleNextPage} disabled={currentPage === totalPages || loading} className={getSecondaryButtonClasses()}>Next <IconChevronRight size={16} className="ml-1" /></button></div></div>
                        )}
                    </div>
                </div>
            </div>

            <AdminFormModal
                isOpen={isAddEditModalOpen}
                onClose={handleModalClose}
                adminToEdit={adminToEditForModal}
                userToMakeAdmin={userToMakeAdminForModal}
                onSuccess={handleModalSuccess}
            />
        </>
    );
}

export default AdminsPage;