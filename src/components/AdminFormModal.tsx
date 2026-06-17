import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useState, ChangeEvent, FormEvent } from 'react';
import { IconX, IconShieldLock, IconCheckbox, IconMapPin, IconCircleCheck, IconAlertCircle } from '@tabler/icons-react';
import { Switch } from '@headlessui/react';

import api from '../lib/supabaseClient';
import { AdminUserSummary, CustomerSearchResultAdmin, AdminRole } from '../lib/types';
import { useNotification } from './NotificationProvider';
import LoadingSpinner from './LoadingSpinner';
import { getBaseInputClasses, getPrimaryButtonClasses, getSecondaryButtonClasses } from '../lib/twUtils';

const ALL_ADMIN_ROLES: AdminRole[] = ["super-admin", "telecalling-owner-team", "marketing-team", "telecalling-tenant-team", "sales-team", "accounts-team"];

interface AdminFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    adminToEdit?: AdminUserSummary | null;
    userToMakeAdmin?: CustomerSearchResultAdmin | null;
    onSuccess: () => void;
}

interface AdminFormBodyProps {
    adminToEdit?: AdminUserSummary | null;
    userToMakeAdmin?: CustomerSearchResultAdmin | null;
    onClose: () => void;
    onSuccess: () => void;
}

function AdminFormBody({ adminToEdit, userToMakeAdmin, onClose, onSuccess }: AdminFormBodyProps) {
    const { showSuccessNotification, showErrorNotification } = useNotification();

    const [isEditing] = useState<boolean>(!!adminToEdit);
    const [targetUserId] = useState<string | null>(adminToEdit?.user_id || userToMakeAdmin?.user_id || null);
    const [targetUserName] = useState<string | null>(adminToEdit?.full_name || adminToEdit?.email || userToMakeAdmin?.full_name || userToMakeAdmin?.email || null);
    const [selectedRoles, setSelectedRoles] = useState<AdminRole[]>(adminToEdit?.roles || []);
    const [pincodes, setPincodes] = useState<string>((adminToEdit?.served_pincodes || []).join(', '));
    const [isActive, setIsActive] = useState<boolean>(adminToEdit ? adminToEdit.is_active : true);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRoleToggle = (role: AdminRole) => {
        setSelectedRoles(prev =>
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    };

    const handlePincodesChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPincodes(e.target.value);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!targetUserId) {
            setError("Target user ID is missing.");
            return;
        }

        if (selectedRoles.length === 0) {
            const message = isEditing
                ? "No roles selected. This will remove all admin privileges, effectively deleting them as an admin. Continue?"
                : "No roles selected. The new user will not have any admin privileges. Proceed?";
            if (!window.confirm(message)) {
                return;
            }
        }

        setLoading(true);
        setError(null);

        const pincodesArray = pincodes.split(',')
            .map(p => p.trim())
            .filter(p => p !== '')
            .map(Number)
            .filter(n => !isNaN(n) && Number.isInteger(n) && n > 0);

        if (pincodes.split(',').some(p => p.trim() !== '' && isNaN(Number(p.trim())))) {
            showErrorNotification("Invalid Pincodes", "Pincodes must be comma-separated numbers.");
            setLoading(false);
            return;
        }

        try {
            const { error: rolesError } = await api.setAdminRoles({ p_user_id: targetUserId, p_roles: selectedRoles });
            if (rolesError) throw new Error(`Role update failed: ${typeof rolesError === 'string' ? rolesError : rolesError.message}`);

            if (selectedRoles.length > 0) {
                const { error: pincodesError } = await api.updateAdminPincodes({ p_user_id: targetUserId, p_pincodes: pincodesArray });
                if (pincodesError) throw new Error(`Pincode update failed: ${typeof pincodesError === 'string' ? pincodesError : pincodesError.message}`);

                const originalIsActive = adminToEdit ? adminToEdit.is_active : true;

                if (isActive !== originalIsActive) {
                    if (isActive) {
                        const { error: activateError } = await api.activateAdmin(targetUserId);
                        if (activateError) throw new Error(`Activation failed: ${typeof activateError === 'string' ? activateError : activateError.message}`);
                    } else {
                        const { error: deactivateError } = await api.deactivateAdmin(targetUserId);
                        if (deactivateError) throw new Error(`Deactivation failed: ${typeof deactivateError === 'string' ? deactivateError : deactivateError.message}`);
                    }
                }
            }

            showSuccessNotification("Admin Details Saved", `${targetUserName || 'Admin'}'s details have been successfully updated.`);
            onSuccess();
            onClose();
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : "Could not save admin details.";
            setError(errMsg);
            showErrorNotification("Save Failed", errMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <DialogTitle as="h3" className="text-lg font-medium text-gray-900 flex items-center">
                    <IconShieldLock className='mr-2 text-gray-500' />
                    {isEditing ? 'Edit Admin: ' : 'Assign Admin Roles to: '}
                    <span className='font-semibold ml-1'>{targetUserName}</span>
                </DialogTitle>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
                    <IconX className="h-5 w-5" />
                </button>
            </div>

            <div className="p-6 space-y-6">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-700 flex items-center">
                            <IconAlertCircle className="w-4 h-4 mr-2 text-red-500 flex-shrink-0" />
                            {error}
                        </p>
                    </div>
                )}
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <IconCheckbox className="mr-1.5 text-gray-400" /> Admin Roles
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50">
                        {ALL_ADMIN_ROLES.map((role) => (
                            <div key={role} className="flex items-center">
                                <input
                                    id={`role-${role}`}
                                    name="roles"
                                    type="checkbox"
                                    value={role}
                                    checked={selectedRoles.includes(role)}
                                    onChange={() => handleRoleToggle(role)}
                                    className="h-4 w-4 rounded border-gray-300 text-[#D9A619] focus:ring-[#D9A619]"
                                    disabled={loading}
                                />
                                <label htmlFor={`role-${role}`} className="ml-3 block text-sm text-gray-700 capitalize">
                                    {role.replace(/-/g, ' ')}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <label htmlFor="pincodes" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <IconMapPin className="mr-1.5 text-gray-400" /> Served Pincodes (comma-separated)
                    </label>
                    <input
                        type="text"
                        id="pincodes"
                        value={pincodes}
                        onChange={handlePincodesChange}
                        className={getBaseInputClasses()}
                        placeholder="e.g., 600001, 600002"
                        disabled={loading}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 flex items-center">
                        <IconCircleCheck className="mr-1.5 text-gray-400" /> Active Status
                    </span>
                    <Switch
                        checked={isActive}
                        onChange={setIsActive}
                        disabled={loading}
                        className={`${isActive ? 'bg-[#D9A619]' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2`}
                    >
                        <span className={`${isActive ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                    </Switch>
                </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end bg-gray-50 space-x-3">
                <button type="button" onClick={onClose} className={getSecondaryButtonClasses()} disabled={loading}>
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading || !targetUserId}
                    className={getPrimaryButtonClasses()}
                >
                    {loading ? <LoadingSpinner size={16} /> : (isEditing ? 'Save Changes' : 'Assign Roles & Add Admin')}
                </button>
            </div>
        </form>
    );
}


function AdminFormModal({ isOpen, onClose, adminToEdit, userToMakeAdmin, onSuccess }: AdminFormModalProps) {
    const key = adminToEdit?.user_id || userToMakeAdmin?.user_id || 'new';

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                </TransitionChild>
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                            <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                                {isOpen &&
                                    <AdminFormBody
                                        key={key}
                                        adminToEdit={adminToEdit}
                                        userToMakeAdmin={userToMakeAdmin}
                                        onClose={onClose}
                                        onSuccess={onSuccess}
                                    />
                                }
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

export default AdminFormModal;