import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { IconX, IconCalendar, IconListCheck, IconNote, IconUser, IconAlertCircle, IconUsersGroup } from '@tabler/icons-react';
import { InteractionStatus, CustomerInteractionAdminView } from '../lib/types';
import api from '../lib/supabaseClient';
import { useNotification } from './NotificationProvider';
import LoadingSpinner from './LoadingSpinner';
import { getBaseInputClasses, getPrimaryButtonClasses, getSecondaryButtonClasses } from '../lib/twUtils';
import SearchableSelect from './SearchableSelect';
import * as displayUtils from '../lib/displayUtils';
import { useAuth } from '../lib/AuthContext';

const statusOptions = Object.entries(displayUtils.interactionStatusMap)
    .map(([value, label]) => ({ value: value as InteractionStatus, label }));

interface InteractionEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    interaction: CustomerInteractionAdminView | null;
    onSuccess: () => void;
}

interface InteractionEditFormBodyProps {
    interaction: CustomerInteractionAdminView;
    onClose: () => void;
    onSuccess: () => void;
}

function InteractionEditFormBody({ interaction, onClose, onSuccess }: InteractionEditFormBodyProps) {
    const { isSuperAdmin } = useAuth();
    const { showSuccessNotification, showErrorNotification } = useNotification();

    const [scheduledFor, setScheduledFor] = useState<string>(
        interaction.scheduled_for ? interaction.scheduled_for.split('T')[0] : ''
    );
    const [status, setStatus] = useState<InteractionStatus>(interaction.interaction_status);
    const [adminNotes, setAdminNotes] = useState<string>(interaction.admin_notes || '');
    const [assignedTenantTelecallerId, setAssignedTenantTelecallerId] = useState<string | undefined>(interaction.assigned_tenant_telecaller_id || undefined);
    const [initialTenantTelecallerName] = useState<string | undefined>(interaction.assigned_tenant_telecaller_name || undefined);
    const [assignedSalesAdminId, setAssignedSalesAdminId] = useState<string | undefined>(interaction.assigned_sales_admin_id || undefined);
    const [initialSalesAdminName] = useState<string | undefined>(interaction.assigned_sales_admin_name || undefined);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const scheduledForSubmitValue = scheduledFor ? scheduledFor : undefined;
            const { error: updateError } = await api.updateCustomerInteractionAdmin({
                p_interaction_id: interaction.interaction_id,
                p_new_scheduled_for: scheduledForSubmitValue,
                p_new_status: status,
                p_new_admin_notes: adminNotes || undefined,
                p_assign_tenant_telecaller_id: assignedTenantTelecallerId,
                p_assign_sales_admin_id: assignedSalesAdminId,
            });

            if (updateError) {
                throw new Error(typeof updateError === 'string' ? updateError : updateError.message);
            }

            showSuccessNotification("Interaction Updated", "Interaction updated successfully!");
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error updating interaction:', err);
            const errMsg = err instanceof Error ? err.message : 'An unexpected error occurred.';
            setError(errMsg);
            showErrorNotification("Error updating interaction", errMsg);
        } finally {
            setLoading(false);
        }
    };

    const fetchTenantTelecallerOptions = async (query: string): Promise<{ value: string; label: string }[]> => {
        const { data, error: adminError } = await api.listAdmins('telecalling-tenant-team', true, query, 0, 20);
        if (adminError) {
            console.error("Error fetching tenant telecallers:", adminError);
            showErrorNotification("Admin Search Error", "Could not load tenant telecallers.");
            return [];
        }
        return (data || []).map((admin) => ({
            value: admin.user_id,
            label: `${admin.full_name || admin.email} (${admin.email})`,
        }));
    };

    const fetchSalesAdminOptions = async (query: string): Promise<{ value: string; label: string }[]> => {
        const { data, error: adminError } = await api.listAdmins('sales-team', true, query, 0, 20);
        if (adminError) {
            console.error("Error fetching sales admins:", adminError);
            showErrorNotification("Admin Search Error", "Could not load sales admins.");
            return [];
        }
        return (data || []).map((admin) => ({
            value: admin.user_id,
            label: `${admin.full_name || admin.email} (${admin.email})`,
        }));
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900">
                    Edit Interaction (Customer: {interaction.customer_name})
                </h2>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors duration-200">
                    <IconX className="h-5 w-5" />
                </button>
            </div>

            <div className="px-6 py-5 space-y-6">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-700 flex items-center">
                            <IconAlertCircle className="w-4 h-4 mr-2 text-red-500" />
                            {error}
                        </p>
                    </div>
                )}

                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><IconListCheck size={16} /></div>
                        <select id="status" value={status} onChange={(e) => setStatus(e.target.value as InteractionStatus)} className={`pl-10 ${getBaseInputClasses()}`} disabled={loading}>
                            {statusOptions.map(option => (<option key={option.value} value={option.value}>{option.label}</option>))}
                        </select>
                    </div>
                </div>

                {isSuperAdmin && (
                    <SearchableSelect
                        label="Assign Tenant Telecaller (Super Admin)"
                        value={assignedTenantTelecallerId}
                        onChange={(value) => setAssignedTenantTelecallerId(value as string | undefined)}
                        fetchOptions={fetchTenantTelecallerOptions}
                        placeholder="Search Tenant Telecallers..."
                        icon={<IconUser size={16} />}
                        disabled={loading}
                        initialDisplayValue={initialTenantTelecallerName}
                    />
                )}

                {isSuperAdmin && (
                    <SearchableSelect
                        label="Assign Sales Admin (Super Admin)"
                        value={assignedSalesAdminId}
                        onChange={(value) => setAssignedSalesAdminId(value as string | undefined)}
                        fetchOptions={fetchSalesAdminOptions}
                        placeholder="Search Sales Admins..."
                        icon={<IconUsersGroup size={16} />}
                        disabled={loading}
                        initialDisplayValue={initialSalesAdminName}
                    />
                )}

                <div>
                    <label htmlFor="scheduledFor" className="block text-sm font-medium text-gray-700">Scheduled For</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><IconCalendar size={16} /></div>
                        <input type="date" id="scheduledFor" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} className={`pl-10 ${getBaseInputClasses()}`} disabled={loading} />
                    </div>
                </div>

                <div>
                    <label htmlFor="adminNotes" className="block text-sm font-medium text-gray-700">Admin Notes</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute top-0 left-0 pl-3 pt-2 flex items-start pointer-events-none text-gray-400"><IconNote size={16} /></div>
                        <textarea id="adminNotes" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={4} className={`pl-10 ${getBaseInputClasses()}`} placeholder="Enter any internal notes here..." disabled={loading} />
                    </div>
                </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end bg-gray-50">
                <div className="flex items-center space-x-3">
                    <button type="button" onClick={onClose} className={getSecondaryButtonClasses()} disabled={loading}>Cancel</button>
                    <button type="submit" className={getPrimaryButtonClasses()} disabled={loading}>
                        {loading ? (<><LoadingSpinner size={16} className="mr-2" />Saving...</>) : 'Update Interaction'}
                    </button>
                </div>
            </div>
        </form>
    );
}

function InteractionEditModal({ isOpen, onClose, interaction, onSuccess }: InteractionEditModalProps) {
    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={onClose}>
                <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                </TransitionChild>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                            <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                                {isOpen && interaction && (
                                    <InteractionEditFormBody
                                        key={interaction.interaction_id}
                                        interaction={interaction}
                                        onClose={onClose}
                                        onSuccess={onSuccess}
                                    />
                                )}
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

export default InteractionEditModal;