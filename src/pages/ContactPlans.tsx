import { useEffect, useState, useCallback, useMemo, Fragment } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    IconEdit, IconPlus, IconLoader, IconSearch, IconAdjustmentsHorizontal,
    IconCheck, IconLayoutDashboard, IconCircleCheck, IconCircleX, IconWallet,
    IconTrash, IconPhoneCall
} from '@tabler/icons-react';
import { Menu, Transition, MenuButton, MenuItem, MenuItems, Switch } from '@headlessui/react';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../lib/supabaseClient';
import { ContactPlan } from '../lib/types';
import { useNotification } from '../components/NotificationProvider';
import ContactPlanEditModal from '../components/ContactPlanEditModal';
import { getBaseInputClasses } from '../lib/twUtils';

function ContactPlans() {
    const [plans, setPlans] = useState<ContactPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<ContactPlan | null>(null);
    const [updatingPlanId, setUpdatingPlanId] = useState<string | null>(null);
    const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
    const { showSuccessNotification, showErrorNotification } = useNotification();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    const fetchPlans = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await api.getAllContactPlansAdmin();
            if (fetchError) throw new Error(typeof fetchError === 'string' ? fetchError : fetchError.message);
            const sorted = (data || []).sort((a, b) => a.price - b.price);
            setPlans(sorted);
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to fetch contact plans';
            setError(errMsg);
            showErrorNotification('Error Fetching Plans', errMsg);
            setPlans([]);
        } finally {
            setLoading(false);
        }
    }, [showErrorNotification]);

    useEffect(() => { fetchPlans(); }, [fetchPlans]);

    const filteredPlans = useMemo(() => {
        return plans.filter(plan => {
            const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (plan.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && plan.is_active) ||
                (statusFilter === 'inactive' && !plan.is_active);
            return matchesSearch && matchesStatus;
        });
    }, [plans, searchTerm, statusFilter]);

    const metrics = useMemo(() => {
        const total = plans.length;
        const active = plans.filter(p => p.is_active).length;
        const inactive = total - active;
        const avgPrice = total > 0 ? plans.reduce((acc, p) => acc + p.price, 0) / total : 0;
        return { total, active, inactive, avgPrice };
    }, [plans]);

    const handleEditPlan = (plan: ContactPlan) => { setSelectedPlan(plan); setIsModalOpen(true); };
    const handleAddPlan = () => { setSelectedPlan(null); setIsModalOpen(true); };
    const handleModalClose = () => { setIsModalOpen(false); setSelectedPlan(null); };

    const handleToggleActive = async (plan: ContactPlan) => {
        setUpdatingPlanId(plan.plan_id);
        try {
            const { error: updateError } = await api.updateContactPlanAdmin({
                p_plan_id: plan.plan_id,
                p_name: plan.name,
                p_description: plan.description || '',
                p_contacts: plan.contacts,
                p_price: plan.price,
                p_is_active: !plan.is_active,
            });
            if (updateError) throw new Error(typeof updateError === 'string' ? updateError : updateError.message);
            showSuccessNotification(`Plan ${plan.is_active ? 'Deactivated' : 'Activated'}`, `Contact plan "${plan.name}" updated.`);
            setPlans(prev => prev.map(p => p.plan_id === plan.plan_id ? { ...p, is_active: !p.is_active } : p));
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to update plan status';
            showErrorNotification('Error Updating Plan', errMsg);
        } finally {
            setUpdatingPlanId(null);
        }
    };

    const handleDeletePlan = async (plan: ContactPlan) => {
        if (!window.confirm(`Are you sure you want to delete "${plan.name}"? This cannot be undone.`)) return;
        setDeletingPlanId(plan.plan_id);
        try {
            const { error: deleteError } = await api.deleteContactPlanAdmin(plan.plan_id);
            if (deleteError) throw new Error(typeof deleteError === 'string' ? deleteError : deleteError.message);
            showSuccessNotification('Plan Deleted', `Contact plan "${plan.name}" has been deleted.`);
            setPlans(prev => prev.filter(p => p.plan_id !== plan.plan_id));
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to delete plan';
            showErrorNotification('Error Deleting Plan', errMsg);
        } finally {
            setDeletingPlanId(null);
        }
    };

    const companyName = import.meta.env.VITE_COMPANY_NAME || 'Admin Panel';

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-12">
            <Helmet>
                <title>{`Contact Plans | ${companyName}`}</title>
            </Helmet>

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl shadow-sm" role="alert">
                        <p className="font-bold">System Error</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Contact Plans</h1>
                        <p className="mt-1 text-sm text-gray-500 font-normal tracking-wide">Manage owner contact unlock credit packages.</p>
                    </div>
                    <button
                        onClick={handleAddPlan}
                        className="inline-flex items-center px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl shadow-lg shadow-slate-200 hover:bg-slate-800 hover:scale-[1.02] transform transition-all active:scale-[0.98]"
                    >
                        <IconPlus className="mr-2" size={20} stroke={2} />
                        Add New Plan
                    </button>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Plans', value: metrics.total, icon: <IconLayoutDashboard size={24} />, color: 'blue' },
                        { label: 'Active Plans', value: metrics.active, icon: <IconCircleCheck size={24} />, color: 'emerald' },
                        { label: 'Inactive', value: metrics.inactive, icon: <IconCircleX size={24} />, color: 'amber' },
                        { label: 'Avg. Price', value: `₹${Math.round(metrics.avgPrice).toLocaleString()}`, icon: <IconWallet size={24} />, color: 'indigo' },
                    ].map(({ label, value, icon, color }) => (
                        <div key={label} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md">
                            <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600 mr-4`}>{icon}</div>
                            <div>
                                <p className="text-xs font-normal text-gray-400 uppercase tracking-wider">{label}</p>
                                <p className="text-xl font-medium text-gray-900 mt-0.5">{loading ? '...' : value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between hover:shadow-md transition-all">
                    <div className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <IconSearch size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search plans by name or description..."
                            className={`${getBaseInputClasses()} pl-10 h-11 border-gray-200 focus:border-slate-500 rounded-xl`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <Menu as="div" className="relative inline-block text-left w-full md:w-auto">
                        <MenuButton className="inline-flex items-center justify-between w-full md:w-48 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-normal text-gray-700 bg-white hover:bg-gray-50 transition-colors focus:outline-none shadow-sm">
                            <span className="flex items-center">
                                <IconAdjustmentsHorizontal size={18} className="mr-2 text-gray-400" />
                                {statusFilter === 'all' ? 'All Status' : statusFilter === 'active' ? 'Active Only' : 'Inactive Only'}
                            </span>
                        </MenuButton>
                        <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                            <MenuItems className="absolute right-0 mt-2 w-48 origin-top-right bg-white divide-y divide-gray-100 rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                <div className="px-1 py-1">
                                    {(['all', 'active', 'inactive'] as const).map((status) => (
                                        <MenuItem key={status}>
                                            {({ active }) => (
                                                <button onClick={() => setStatusFilter(status)} className={`${active ? 'bg-slate-50 text-slate-900' : 'text-gray-700'} group flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors`}>
                                                    {statusFilter === status && <IconCheck size={16} className="mr-2 text-slate-900" />}
                                                    <span className={statusFilter === status ? 'font-medium' : ''}>
                                                        {status === 'all' ? 'All Status' : status === 'active' ? 'Active' : 'Inactive'}
                                                    </span>
                                                </button>
                                            )}
                                        </MenuItem>
                                    ))}
                                </div>
                            </MenuItems>
                        </Transition>
                    </Menu>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-medium text-slate-800 flex items-center gap-2">
                            <IconPhoneCall size={20} className="text-[#D9A619]" />
                            Contact Plan Inventory
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {loading ? 'Refreshing plans...' : filteredPlans.length > 0
                                ? `Showing ${filteredPlans.length} plan${filteredPlans.length !== 1 ? 's' : ''}`
                                : 'No plans match your filters.'}
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="p-16 flex justify-center items-center flex-col">
                                <LoadingSpinner size={40} />
                                <p className="mt-4 text-sm font-normal text-slate-500 animate-pulse">Loading Contact Plans...</p>
                            </div>
                        ) : filteredPlans.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                                <div className="p-4 bg-slate-50 rounded-full mb-4">
                                    <IconPhoneCall size={40} className="text-slate-300" />
                                </div>
                                <p className="text-slate-500 text-lg font-medium">No contact plans found</p>
                                <p className="text-slate-400 mt-1 max-w-xs mx-auto">Try adjusting your filters or create a new plan to get started.</p>
                                <button onClick={handleAddPlan} className="mt-6 inline-flex items-center px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors">
                                    <IconPlus size={18} className="mr-2" /> Add New Plan
                                </button>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead>
                                    <tr className="bg-slate-50/80">
                                        <th className="px-6 py-4 text-left text-[11px] font-medium text-slate-500 uppercase tracking-widest">Plan Name</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-medium text-slate-500 uppercase tracking-widest">Description</th>
                                        <th className="px-6 py-4 text-center text-[11px] font-medium text-slate-500 uppercase tracking-widest">Contacts</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-medium text-slate-500 uppercase tracking-widest">Price</th>
                                        <th className="px-6 py-4 text-center text-[11px] font-medium text-slate-500 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-right text-[11px] font-medium text-slate-500 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-50">
                                    {filteredPlans.map((plan) => (
                                        <tr key={plan.plan_id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{plan.name}</div>
                                                <div className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-tighter">ID: {plan.plan_id.substring(0, 8)}</div>
                                                {plan.price === 0 && (
                                                    <span className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700">FREE</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-sm text-slate-600 max-w-xs font-medium line-clamp-2" title={plan.description ?? ''}>
                                                    {plan.description || <span className="italic text-slate-300">No description</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                                    {plan.contacts} Contacts
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="text-sm font-bold text-slate-900">
                                                    {plan.price === 0 ? <span className="text-teal-600">Free</span> : `₹${plan.price.toLocaleString()}`}
                                                </div>
                                                {plan.price > 0 && (
                                                    <div className="text-[10px] font-semibold text-slate-400 mt-0.5">
                                                        ≈ ₹{Math.round(plan.price / plan.contacts)} per contact
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-center">
                                                <div className="flex flex-col items-center">
                                                    <Switch
                                                        checked={plan.is_active}
                                                        onChange={() => handleToggleActive(plan)}
                                                        disabled={updatingPlanId === plan.plan_id}
                                                        className={`${plan.is_active ? 'bg-emerald-500 shadow-emerald-100' : 'bg-slate-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none shadow-sm ${updatingPlanId === plan.plan_id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                    >
                                                        <span className="sr-only">Toggle plan status</span>
                                                        <span className={`${plan.is_active ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ease-in-out shadow-sm`} />
                                                        {updatingPlanId === plan.plan_id && <IconLoader size={12} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-slate-500" />}
                                                    </Switch>
                                                    <span className={`text-[9px] font-bold mt-1.5 uppercase tracking-widest ${plan.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                        {plan.is_active ? 'Active' : 'Disabled'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEditPlan(plan)}
                                                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 shadow-sm hover:shadow"
                                                        title="Edit Plan"
                                                    >
                                                        <IconEdit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePlan(plan)}
                                                        disabled={deletingPlanId === plan.plan_id}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-200 shadow-sm hover:shadow disabled:opacity-50"
                                                        title="Delete Plan"
                                                    >
                                                        {deletingPlanId === plan.plan_id ? <IconLoader size={18} className="animate-spin" /> : <IconTrash size={18} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            <ContactPlanEditModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                plan={selectedPlan}
                onSuccess={fetchPlans}
            />
        </div>
    );
}

export default ContactPlans;
