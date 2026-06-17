import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useState, useEffect, useCallback } from 'react';
import {
    IconX, IconFileText, IconUser, IconBuildingSkyscraper, IconListCheck,
    IconNote, IconAlertCircle, IconHomeCheck, IconUsers
} from '@tabler/icons-react';
import { RentalApplicationAdminDetails, RentalApplicationStatus } from '../../lib/types';
import api from '../../lib/supabaseClient';
import { useNotification } from '../NotificationProvider';
import LoadingSpinner from '../LoadingSpinner';
import { getBaseInputClasses, getPrimaryButtonClasses, getSecondaryButtonClasses } from '../../lib/twUtils';
import * as displayUtils from '../../lib/displayUtils';
import { formatTimestamp } from '../../lib/utils';
import { useAuth } from '../../lib/AuthContext';
import SearchableSelect from '../SearchableSelect';

const rentalApplicationStatusOptions = Object.entries(displayUtils.rentalApplicationStatusMap)
    .map(([value, label]) => ({ value: value as RentalApplicationStatus, label }));

interface RentalApplicationDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    applicationId: string | null;
    onSuccess?: () => void;
}

function RentalApplicationDetailModal({ isOpen, onClose, applicationId, onSuccess }: RentalApplicationDetailModalProps) {
    const { user: currentUser, roles: currentUserRoles, isSuperAdmin } = useAuth();
    const [application, setApplication] = useState<RentalApplicationAdminDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { showSuccessNotification, showErrorNotification } = useNotification();

    // Editable fields state
    const [currentStatus, setCurrentStatus] = useState<RentalApplicationStatus | undefined>(undefined);
    const [newAdminNote, setNewAdminNote] = useState<string>('');
    const [targetAssignAdminId, setTargetAssignAdminId] = useState<string | undefined>(undefined);


    const fetchApplicationDetails = useCallback(async () => {
        if (!applicationId) return;
        setLoading(true); setError(null);
        try {
            const { data, error: fetchError } = await api.adminGetRentalApplicationDetails(applicationId);
            if (fetchError) throw fetchError;
            if (!data) throw new Error("Application details not found.");
            setApplication(data);
            setCurrentStatus(data.status);
            setTargetAssignAdminId(data.assigned_admin_id || undefined); // Pre-fill for super-admin assignment
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to fetch application details.';
            setError(errMsg); showErrorNotification("Error Loading Details", errMsg);
            setApplication(null);
        } finally { setLoading(false); }
    }, [applicationId, showErrorNotification]);

    useEffect(() => {
        if (isOpen && applicationId) {
            fetchApplicationDetails();
        } else if (!isOpen) {
            setApplication(null); setError(null); setNewAdminNote('');
            setCurrentStatus(undefined); setTargetAssignAdminId(undefined);
        }
    }, [isOpen, applicationId, fetchApplicationDetails]);

    const handleStatusUpdate = async () => {
        if (!application || !currentStatus || currentStatus === application.status) return;
        setActionLoading(true); setError(null);
        try {
            await api.adminUpdateRentalApplicationStatus({
                p_application_id: application.application_id,
                p_new_status: currentStatus,
                p_admin_note: newAdminNote || `Status changed to ${currentStatus}` // Auto-note for status change
            });
            showSuccessNotification("Status Updated", `Application status changed to ${displayUtils.getDisplayValue(displayUtils.rentalApplicationStatusMap, currentStatus)}.`);
            setNewAdminNote('');
            fetchApplicationDetails(); // Refresh details
            if (onSuccess) onSuccess();
        } catch (err) {
            showErrorNotification("Status Update Failed", err instanceof Error ? err.message : "Could not update status.");
        } finally { setActionLoading(false); }
    };

    const handleAddNote = async () => {
        if (!application || !newAdminNote.trim()) return;
        setActionLoading(true); setError(null);
        try {
            await api.adminAddRentalApplicationNote({ p_application_id: application.application_id, p_note: newAdminNote });
            showSuccessNotification("Note Added", "Admin note added successfully.");
            setNewAdminNote('');
            fetchApplicationDetails(); // Refresh details
        } catch (err) {
            showErrorNotification("Failed to Add Note", err instanceof Error ? err.message : "Could not add note.");
        } finally { setActionLoading(false); }
    };

    const handleFinalizeLease = async () => {
        if (!application || !window.confirm("Are you sure you want to finalize this lease? This will mark the property as rented and assign the tenant.")) return;
        setActionLoading(true); setError(null);
        try {
            await api.adminFinalizeLeaseFromApplication(application.application_id);
            showSuccessNotification("Lease Finalized", "Property rented and tenant assigned.");
            fetchApplicationDetails();
            if (onSuccess) onSuccess();
            onClose(); // Close modal after successful finalization
        } catch (err) {
            showErrorNotification("Lease Finalization Failed", err instanceof Error ? err.message : "Could not finalize lease.");
        } finally { setActionLoading(false); }
    };

    const handleAssignAdmin = async () => {
        if (!application || !targetAssignAdminId || !isSuperAdmin) return;
        if (targetAssignAdminId === application.assigned_admin_id) {
            showErrorNotification("No Change", "Admin is already assigned.");
            return;
        }
        setActionLoading(true); setError(null);
        try {
            await api.adminAssignRentalApplication({ p_application_id: application.application_id, p_target_admin_id: targetAssignAdminId });
            showSuccessNotification("Admin Assigned", "Application assigned to new admin.");
            fetchApplicationDetails();
            if (onSuccess) onSuccess();
        } catch (err) {
            showErrorNotification("Assignment Failed", err instanceof Error ? err.message : "Could not assign admin.");
        } finally { setActionLoading(false); }
    };

    const fetchAdminOptionsForAssignment = async (query: string): Promise<{ value: string; label: string }[]> => {
        const { data, error: adminError } = await api.listAdmins(undefined, true, query, 0, 20); // Fetch all active admins
        if (adminError) { showErrorNotification("Admin Search Error", "Could not load admins."); return []; }
        return (data || []).filter(admin =>
            admin.roles.includes('telecalling-owner-team') ||
            admin.roles.includes('telecalling-tenant-team') ||
            admin.roles.includes('super-admin') // Allow assigning to super-admin too
        ).map((admin) => ({ value: admin.user_id, label: `${admin.full_name || admin.email}` }));
    };


    const canFinalize = application && ['PAYMENT_CONFIRMED', 'LEASE_FINALIZED'].includes(application.status) &&
        (isSuperAdmin ||
            ((currentUserRoles.includes('telecalling-owner-team') || currentUserRoles.includes('telecalling-tenant-team')) && application.assigned_admin_id === currentUser?.id) ||
            (currentUserRoles.includes('accounts-team') && application.status === 'PAYMENT_CONFIRMED')
        );


    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-20" onClose={onClose}>
                <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </TransitionChild>
                <div className="fixed inset-0 z-20 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                            <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl">
                                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                                    <h2 className="text-lg font-medium text-gray-900 flex items-center">
                                        <IconFileText className='mr-2 text-gray-600' />
                                        Rental Application: #{application?.application_id.substring(0, 8)}...
                                    </h2>
                                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500"><IconX className="h-5 w-5" /></button>
                                </div>

                                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                                    {loading && <div className='text-center p-10'><LoadingSpinner /></div>}
                                    {error && !loading && <div className="p-3 bg-red-50 border border-red-200 rounded-md"><p className="text-sm text-red-700 flex items-center"><IconAlertCircle className="w-4 h-4 mr-2 text-red-500" />{error}</p></div>}

                                    {application && !loading && (
                                        <>
                                            {/* Application Info & Status Update */}
                                            <div className="border border-gray-200 rounded-md p-4">
                                                <h3 className="text-base font-semibold text-gray-800 mb-3">Application Overview</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                                    <div>
                                                        <label htmlFor="appStatus" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                                        <select id="appStatus" value={currentStatus} onChange={(e) => setCurrentStatus(e.target.value as RentalApplicationStatus)} className={getBaseInputClasses()}>
                                                            {rentalApplicationStatusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="md:pt-7">
                                                        <button onClick={handleStatusUpdate} className={getPrimaryButtonClasses()} disabled={actionLoading || currentStatus === application.status}>
                                                            {actionLoading ? <LoadingSpinner size={16} /> : 'Update Status'}
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2">Submitted: {formatTimestamp(application.submitted_at)} | Last Update: {formatTimestamp(application.updated_at)}</p>
                                                <p className="text-xs text-gray-500">Assigned Admin: {application.assigned_admin_name || <span className="italic">Unassigned</span>}</p>
                                            </div>

                                            {/* Applicant, Property, Landlord Details */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <Section title="Applicant" icon={<IconUser size={16} />}>
                                                    <DetailItem label="Name" value={application.applicant_name} />
                                                    <DetailItem label="Email" value={application.applicant_email} />
                                                    <DetailItem label="Phone" value={application.applicant_phone} />
                                                </Section>
                                                <Section title="Property" icon={<IconBuildingSkyscraper size={16} />}>
                                                    <DetailItem label="Address" value={application.property_address} />
                                                    <DetailItem label="Locality" value={`${application.property_locality}, ${application.property_city}`} />
                                                    <DetailItem label="Rent" value={`₹${application.property_price.toLocaleString()}`} />
                                                </Section>
                                                <Section title="Landlord" icon={<IconUser size={16} />}>
                                                    <DetailItem label="Name" value={application.landlord_name} />
                                                    <DetailItem label="Email" value={application.landlord_email} />
                                                    <DetailItem label="Phone" value={application.landlord_phone} />
                                                </Section>
                                            </div>

                                            {/* Application Data (from JSONB) */}
                                            {application.application_data && Object.keys(application.application_data).length > 0 && (
                                                <Section title="Application Details" icon={<IconListCheck size={16} />}>
                                                    {Object.entries(application.application_data).map(([key, value]) => (
                                                        <DetailItem key={key} label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} value={String(value)} />
                                                    ))}
                                                </Section>
                                            )}

                                            {/* Admin Notes */}
                                            <Section title="Admin Notes & Log" icon={<IconNote size={16} />}>
                                                {application.admin_notes ? (
                                                    <pre className="text-xs bg-gray-50 p-2 border rounded-md max-h-40 overflow-y-auto whitespace-pre-wrap">{application.admin_notes}</pre>
                                                ) : (
                                                    <p className="text-xs italic text-gray-500">No notes yet.</p>
                                                )}
                                                <div className="mt-3">
                                                    <textarea value={newAdminNote} onChange={(e) => setNewAdminNote(e.target.value)} rows={2} className={getBaseInputClasses()} placeholder="Add new note..." />
                                                    <button onClick={handleAddNote} className={`${getSecondaryButtonClasses()} mt-1 text-xs px-3 py-1`} disabled={actionLoading || !newAdminNote.trim()}>Add Note</button>
                                                </div>
                                            </Section>

                                            {/* Super Admin: Assign Admin */}
                                            {isSuperAdmin && (
                                                <Section title="Assign Admin (Super Admin)" icon={<IconUsers size={16} />}>
                                                    <SearchableSelect
                                                        label="Assign to Admin"
                                                        value={targetAssignAdminId}
                                                        onChange={(val) => setTargetAssignAdminId(val as string | undefined)}
                                                        fetchOptions={fetchAdminOptionsForAssignment}
                                                        placeholder="Search Telecalling Admins..."
                                                        initialDisplayValue={application.assigned_admin_name || undefined}
                                                    />
                                                    <button onClick={handleAssignAdmin} className={`${getPrimaryButtonClasses()} mt-2 text-xs px-3 py-1`} disabled={actionLoading || !targetAssignAdminId || targetAssignAdminId === application.assigned_admin_id}>
                                                        {actionLoading ? <LoadingSpinner size={14} /> : "Assign/Re-assign"}
                                                    </button>
                                                </Section>
                                            )}

                                            {/* Finalize Lease Action */}
                                            {canFinalize && (
                                                <div className="mt-4 pt-4 border-t border-gray-200">
                                                    <button onClick={handleFinalizeLease} className={`${getPrimaryButtonClasses({ className: "bg-green-600 hover:bg-green-700 text-white w-full justify-center" })} `} disabled={actionLoading}>
                                                        {actionLoading ? <LoadingSpinner size={16} /> : <><IconHomeCheck size={16} className="mr-2" />Finalize Lease & Assign Tenant</>}
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="px-6 py-4 border-t border-gray-200 flex justify-end bg-gray-50">
                                    <button type="button" onClick={onClose} className={getSecondaryButtonClasses()}>Close</button>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

// Helper sub-components for modal sections
const Section: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="border border-gray-200 rounded-md p-3">
        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
            {icon && <span className="mr-1.5 text-gray-500">{icon}</span>}
            {title}
        </h4>
        {children}
    </div>
);

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="mb-1.5">
        <dt className="text-xs font-medium text-gray-500">{label}</dt>
        <dd className="text-sm text-gray-800 break-words">{value || <span className="italic text-gray-400">N/A</span>}</dd>
    </div>
);


export default RentalApplicationDetailModal;