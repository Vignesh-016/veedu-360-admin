import { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { IconEdit, IconPlus, IconLoader, IconCertificate, IconSettings, IconCheck, IconX, IconPercentage, IconBriefcase, IconExternalLink, IconMapPin, IconUpload } from '@tabler/icons-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ManagementPlanFormModal from '../components/ManagementPlanFormModal';
import api from '../lib/supabaseClient';
import { ManagementPlanInfo } from '../lib/types';
import { useNotification } from '../components/NotificationProvider';
import { Switch } from '@headlessui/react';
import { getPrimaryButtonClasses, getSecondaryButtonClasses } from '../lib/twUtils';

function ManagementPlansPage() {
    const [plans, setPlans] = useState<ManagementPlanInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<ManagementPlanInfo | null>(null);
    const [updatingPlanId, setUpdatingPlanId] = useState<string | null>(null);
    const [accessRequests, setAccessRequests] = useState<Array<{ request_id: string; requester_user_id: string; pincode: number; requested_plan_ids: string[]; status: string; admin_notes: string | null; property_details: Record<string, unknown>; owner_details: Record<string, unknown>; created_at: string }>>([]);
    const [servicePincodes, setServicePincodes] = useState<number[]>([]);
    const [newPincode, setNewPincode] = useState('');
    const [pincodeSaving, setPincodeSaving] = useState(false);
    const { showSuccessNotification, showErrorNotification } = useNotification();

    const fetchPlans = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await api.listManagementPlansAdmin(true);
            if (fetchError) throw fetchError;
            const sortedPlans = (data || []).sort((a, b) => a.name.localeCompare(b.name));
            setPlans(sortedPlans);
            const { data: matrix, error: matrixError } = await (api.supabase as any).rpc('list_management_pincode_matrix_admin');
            if (matrixError) throw matrixError;
            setServicePincodes(Array.from(new Set((matrix || []).map((row: { pincode: number }) => row.pincode))));
            const { data: requests, error: requestsError } = await (api.supabase as any).rpc('list_management_plan_access_requests_admin');
            if (requestsError) throw requestsError;
            // The access-request RPC may return an incomplete owner_details
            // object. Hydrate the owner from the canonical customer record so
            // the admin table never falls back to placeholder values when the
            // request itself has a valid requester_user_id.
            const hydratedRequests = await Promise.all((requests || []).map(async (request: typeof accessRequests[number]) => {
                const owner = request.owner_details || {};
                if (owner.full_name || owner.name || owner.email || owner.phone) return request;

                const { data: customer } = await api.getCustomerFullDetails(request.requester_user_id);
                if (!customer) return request;

                return {
                    ...request,
                    owner_details: {
                        ...owner,
                        full_name: customer.full_name,
                        email: customer.email,
                        phone: customer.phone,
                    },
                };
            }));
            setAccessRequests(hydratedRequests);
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to fetch management plans';
            setError(errMsg);
            showErrorNotification("Error Fetching Plans", errMsg);
            setPlans([]);
        } finally {
            setLoading(false);
        }
    }, [showErrorNotification]);

    const addPincode = async () => {
        const pincode = Number(newPincode);
        if (!Number.isInteger(pincode) || pincode < 100000 || pincode > 999999) { showErrorNotification('Invalid Pincode', 'Enter a valid six-digit pincode.'); return; }
        setPincodeSaving(true);
        try { const { error } = await (api.supabase as any).rpc('bulk_add_management_service_pincodes_admin', { p_pincodes: [pincode] }); if (error) throw error; setNewPincode(''); await fetchPlans(); showSuccessNotification('Pincode Added', `${pincode} is ready for plan restrictions.`); }
        catch (err) { showErrorNotification('Could Not Add Pincode', err instanceof Error ? err.message : 'Failed to add pincode.'); } finally { setPincodeSaving(false); }
    };

    const uploadPincodes = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]; if (!file) return;
        const values = Array.from(new Set((await file.text()).match(/\b\d{6}\b/g) || [])).map(Number);
        if (!values.length) { showErrorNotification('No Pincodes Found', 'Upload a CSV or TXT file containing six-digit pincodes.'); return; }
        setPincodeSaving(true);
        try { const { data, error } = await (api.supabase as any).rpc('bulk_add_management_service_pincodes_admin', { p_pincodes: values }); if (error) throw error; await fetchPlans(); showSuccessNotification('Bulk Upload Complete', `${data || 0} new pincodes were added.`); }
        catch (err) { showErrorNotification('Bulk Upload Failed', err instanceof Error ? err.message : 'Could not upload pincodes.'); } finally { setPincodeSaving(false); event.target.value = ''; }
    };




    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    const handleAddPlan = () => {
        setSelectedPlan(null);
        setIsModalOpen(true);
    };

    const handleEditPlan = (plan: ManagementPlanInfo) => {
        setSelectedPlan(plan);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedPlan(null);
    };

    const handleToggleActive = async (plan: ManagementPlanInfo) => {
        setUpdatingPlanId(plan.plan_id);
        try {
            const { error: updateError } = await api.updateManagementPlanAdmin({
                p_plan_id: plan.plan_id,
                p_name: plan.name,
                p_percentage: plan.percentage,
                p_description: plan.description ?? undefined,
                p_is_active: !plan.is_active
            });
            if (updateError) throw updateError;

            showSuccessNotification(`Plan ${plan.is_active ? 'Deactivated' : 'Activated'}`, `Management plan "${plan.name}" updated.`);
            setPlans(prevPlans =>
                prevPlans.map(p =>
                    p.plan_id === plan.plan_id ? { ...p, is_active: !p.is_active } : p
                )
            );
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to update plan status';
            showErrorNotification("Error Updating Plan Status", errMsg);
        } finally {
            setUpdatingPlanId(null);
        }
    };
    const companyName = import.meta.env.VITE_COMPANY_NAME;

    // Metrics calculation
    const totalPlans = plans.length;
    const activePlans = plans.filter(p => p.is_active).length;
    const premiumPlans = plans.filter(p => p.percentage > 10).length;
    const inactivePlans = totalPlans - activePlans;

    const MetricCard = ({ title, value, icon: Icon, bgClass, iconClass, subValue }: { title: string, value: number, icon: any, bgClass: string, iconClass: string, subValue?: string }) => (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all duration-300 hover:shadow-md group flex items-center space-x-4 relative">
            <div className={`p-3 rounded-xl ${bgClass} ${iconClass} transition-colors flex-shrink-0`}>
                <Icon size={24} />
            </div>
            <div className="flex-grow">
                <p className="text-sm font-normal text-gray-500">{title}</p>
                <div className="flex items-baseline justify-between">
                    <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                    {subValue && <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">{subValue}</span>}
                </div>
            </div>
        </div>
    );

    return (
        <>
            <Helmet>
                <title>{`Management Plans | ${companyName}`}</title>
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
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Management Plans</h1>
                            <p className="mt-1 text-sm text-gray-500 font-normal italic">Manage property management service plans and commission rates.</p>
                        </div>
                        <button
                            onClick={handleAddPlan}
                            className={`${getPrimaryButtonClasses()} !rounded-full px-6 py-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 font-medium`}
                        >
                            <IconPlus className="mr-2" size={20} stroke={2} />
                            Add New Plan
                        </button>
                    </div>

                    {/* Metric Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <MetricCard
                            title="Total Plans"
                            value={totalPlans}
                            icon={IconBriefcase}
                            bgClass="bg-blue-50"
                            iconClass="text-blue-600"
                        />
                        <MetricCard
                            title="Active Plans"
                            value={activePlans}
                            icon={IconCheck}
                            bgClass="bg-emerald-50"
                            iconClass="text-emerald-600"
                            subValue="Available"
                        />
                        <MetricCard
                            title="Premium Plans"
                            value={premiumPlans}
                            icon={IconPercentage}
                            bgClass="bg-amber-50"
                            iconClass="text-amber-600"
                            subValue=">10%"
                        />
                        <MetricCard
                            title="Inactive Plans"
                            value={inactivePlans}
                            icon={IconX}
                            bgClass="bg-slate-50"
                            iconClass="text-slate-600"
                        />
                    </div>

                    {/* Plans Table Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                            <div>
                                <h2 className="text-lg font-medium text-gray-800 flex items-center">
                                    <IconSettings size={20} className="mr-2 text-gray-400" /> Service Plans
                                </h2>
                                <p className="text-xs text-gray-400 mt-1 font-normal">
                                    {plans.length > 0
                                        ? `Displaying ${plans.length} configured management plans`
                                        : 'No plans found. Add one to get started.'}
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            {loading ? (
                                <div className="p-10 flex justify-center"><LoadingSpinner /></div>
                            ) : plans.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                                    <IconCertificate size={48} className="text-gray-300 mb-4" />
                                    <p className="text-gray-500 text-lg font-medium">No management plans configured</p>
                                    <p className="text-gray-400 mt-1">Click "Add New Plan" to create the first one.</p>
                                    <button
                                        onClick={handleAddPlan}
                                        className={`mt-4 ${getPrimaryButtonClasses()}`}
                                    >
                                        <IconPlus className="mr-2" size={16} />
                                        Add New Plan
                                    </button>
                                </div>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-[0.2em]">
                                                <div className="flex items-center">
                                                    <IconBriefcase size={14} className="mr-2 opacity-60" /> Name
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-[0.2em]">
                                                <div className="flex items-center">
                                                    <IconPercentage size={14} className="mr-2 opacity-60" /> Percentage
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-[0.2em]">Post Price</th>
                                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-[0.2em]">Fee Purpose</th>
                                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-[0.2em]">
                                                <div className="flex items-center text-gray-500">
                                                    Description
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3.5 text-center text-xs font-medium text-gray-500 uppercase tracking-[0.2em]">Active Status</th>
                                            <th scope="col" className="px-6 py-3.5 text-right text-xs font-medium text-gray-500 uppercase tracking-[0.2em]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {plans.map((plan) => (
                                            <tr key={plan.plan_id} className="hover:bg-blue-50/30 transition-colors duration-150 group">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">{plan.name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">₹{Number(plan.post_price).toFixed(2)}</td>
                                                <td className="px-6 py-4 text-xs text-gray-600">{Number(plan.post_price) === 0 ? <span className="font-semibold text-emerald-700">Free</span> : plan.document_processing_fee_enabled ? 'Document processing' : 'Property post'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <span className="text-sm font-bold text-gray-900 font-mono tracking-tight">{plan.percentage.toFixed(2)}%</span>
                                                        {plan.percentage > 10 && (
                                                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-600 border border-amber-100">Premium</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-500 max-w-xs truncate font-normal italic" title={plan.description ?? ''}>
                                                        {plan.description || <span className="text-xs italic text-gray-300">No additional details</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        <Switch
                                                            checked={plan.is_active}
                                                            onChange={() => handleToggleActive(plan)}
                                                            disabled={updatingPlanId === plan.plan_id}
                                                            className={`${updatingPlanId === plan.plan_id ? 'opacity-50 cursor-not-allowed' : ''}
                                                                ${plan.is_active ? 'bg-emerald-500' : 'bg-gray-200'} relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ring-offset-2 focus:ring-1 focus:ring-emerald-500 shadow-inner`}
                                                        >
                                                            <span className="sr-only">Toggle status</span>
                                                            <span className={`${plan.is_active ? 'translate-x-5.5' : 'translate-x-0.5'} inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out`} />
                                                        </Switch>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${plan.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                                                            {updatingPlanId === plan.plan_id ? <IconLoader size={10} className="animate-spin mr-1" /> : (plan.is_active ? <IconCheck size={10} className="mr-0.5" /> : <IconX size={10} className="mr-0.5" />)}
                                                            {plan.is_active ? 'Active' : 'Disabled'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEditPlan(plan)}
                                                            className={`${getSecondaryButtonClasses()} !p-1.5 hover:bg-blue-50 hover:text-blue-600 border-none shadow-none group/btn`}
                                                            title="Edit Configuration"
                                                        >
                                                            <IconEdit size={16} className="text-gray-400 group-hover/btn:text-blue-500 transition-colors" />
                                                        </button>
                                                        <button
                                                            className={`${getSecondaryButtonClasses()} !p-1.5 hover:bg-gray-50 group/btn border-none shadow-none`}
                                                            title="Details"
                                                        >
                                                            <IconExternalLink size={16} className="text-gray-300 group-hover/btn:text-gray-500 transition-colors" />
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

                    <div className="mt-8 rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                        <div className="border-b border-gray-100 bg-gray-50/30 p-6"><h2 className="flex items-center text-lg font-medium text-gray-800"><IconMapPin size={20} className="mr-2 text-gray-400" /> Pincode Plan Restrictions</h2><p className="mt-1 text-xs text-gray-400">Add pincodes once, then turn plan access on or off for each location.</p></div>
                        <div className="flex flex-col gap-3 border-b border-gray-100 p-6 sm:flex-row sm:items-end"><div><label className="block text-sm font-medium text-gray-700" htmlFor="service-pincode">Add Pincode</label><input id="service-pincode" value={newPincode} onChange={event => setNewPincode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="627001" className="mt-1 rounded-md border-gray-300 shadow-sm" /></div><button onClick={addPincode} disabled={pincodeSaving} className={`${getPrimaryButtonClasses()} whitespace-nowrap`}>Add Pincode</button><label className={`${getSecondaryButtonClasses()} inline-flex cursor-pointer items-center whitespace-nowrap`}><IconUpload size={16} className="mr-2" /> Bulk Upload<input type="file" accept=".csv,.txt,text/csv,text/plain" onChange={uploadPincodes} disabled={pincodeSaving} className="hidden" /></label></div>
                        <div className="flex flex-wrap gap-2 border-t border-gray-100 p-6">{servicePincodes.map(pincode => <span key={pincode} className="rounded-full bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">{pincode}</span>)}{servicePincodes.length === 0 && <p className="text-sm text-gray-400">No pincodes configured.</p>}</div>
                    </div>

                    <div className="mt-8 rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                        <div className="border-b border-gray-100 bg-gray-50/30 p-6"><h2 className="flex items-center text-lg font-medium text-gray-800"><IconSettings size={20} className="mr-2 text-gray-400" /> Paid Plan Access Requests</h2><p className="mt-1 text-xs text-gray-400">Review requests from owners outside the configured pincode coverage.</p></div>
                        <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-100"><thead className="bg-gray-50/50"><tr><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Owner Details</th><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Property Details</th><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Requested Plans</th><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th></tr></thead><tbody className="divide-y divide-gray-100">{accessRequests.map(request => { const owner = request.owner_details || {}; const property = request.property_details || {}; const ownerName = owner.full_name || owner.name || owner.display_name; return <tr key={request.request_id}><td className="px-6 py-4 align-top text-sm text-gray-700"><div className="font-semibold text-gray-900">{String(ownerName || 'Unnamed owner')}</div><div className="mt-1 text-xs text-gray-600">{String(owner.email || owner.email_address || 'No email')}</div><div className="text-xs text-gray-600">{String(owner.phone || owner.phone_number || 'No phone')}</div><div className="mt-1 text-xs text-gray-500">{[owner.address_line1, owner.address_line2, owner.city, owner.state, owner.pincode].filter(Boolean).map(String).join(', ') || 'Address not available'}</div></td><td className="max-w-sm px-6 py-4 align-top text-xs text-gray-600"><div className="font-semibold text-gray-800">{String(property.property_name || property.title || 'Property listing')}</div><div>{[property.property_type, property.listing_type, property.city, property.locality, property.pincode].filter(Boolean).map(String).join(' · ')}</div><div className="mt-1">{property.address ? String(property.address) : `Pincode: ${request.pincode}`}</div><div className="mt-1">{property.price ? `Price: ${String(property.price)}` : ''}{property.area ? ` · Area: ${String(property.area)}` : ''}</div></td><td className="px-6 py-4 align-top text-sm text-gray-600">{request.requested_plan_ids.map(id => plans.find(plan => plan.plan_id === id)?.name || id.slice(0, 8)).join(', ')}</td><td className="px-6 py-4 align-top text-sm text-gray-500">{new Date(request.created_at).toLocaleDateString()}</td><td className="px-6 py-4 align-top text-sm"><span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">Notification Received</span></td></tr>; })}{accessRequests.length === 0 && <tr><td colSpan={5} className="px-6 py-6 text-center text-sm text-gray-400">No paid-plan access requests.</td></tr>}</tbody></table></div>
                    </div>
                </div>

                {/* Modal */}
                <ManagementPlanFormModal
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    plan={selectedPlan}
                    onSuccess={fetchPlans}
                />
            </div>
        </>
    );
}

export default ManagementPlansPage;
