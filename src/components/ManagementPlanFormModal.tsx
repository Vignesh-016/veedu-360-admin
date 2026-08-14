import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useState, FormEvent, ChangeEvent } from 'react';
import { IconX, IconFileText, IconListDetails, IconCheckbox, IconAlertCircle } from '@tabler/icons-react';
import { Switch } from '@headlessui/react';
import { CreateManagementPlanAdminParams, ManagementPlanInfo, UpdateManagementPlanAdminParams } from '../lib/types';
import api from '../lib/supabaseClient';
import { useNotification } from './NotificationProvider';
import LoadingSpinner from './LoadingSpinner';
import { getBaseInputClasses, getPrimaryButtonClasses, getSecondaryButtonClasses } from '../lib/twUtils';

interface ManagementPlanFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan?: ManagementPlanInfo | null;
    onSuccess: () => void;
}

interface ManagementPlanFormBodyProps {
    plan?: ManagementPlanInfo | null;
    onClose: () => void;
    onSuccess: () => void;
}

function ManagementPlanFormBody({ plan, onClose, onSuccess }: ManagementPlanFormBodyProps) {
    const { showSuccessNotification, showErrorNotification } = useNotification();
    const isEditing = !!plan;

    const [name, setName] = useState(plan?.name || '');
    const [percentage] = useState<number | string>(plan?.percentage.toString() || '');
    const [description, setDescription] = useState(plan?.description || '');
    const [isActive, setIsActive] = useState(plan?.is_active ?? true);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        let numericPercentage = parseFloat(percentage as string);
        if (isNaN(numericPercentage)) {
            numericPercentage = 0;
        }

        try {
            if (isEditing && plan) {
                const updateParams: UpdateManagementPlanAdminParams = {
                    p_plan_id: plan.plan_id,
                    p_name: name,
                    p_percentage: numericPercentage,
                    p_description: description || undefined,
                    p_is_active: isActive
                };
                const { error: updateError } = await api.updateManagementPlanAdmin(updateParams);
                if (updateError) throw updateError;
                showSuccessNotification("Plan Updated", "Management plan updated successfully!");
            } else {
                const createParams: CreateManagementPlanAdminParams = {
                    p_name: name,
                    p_percentage: numericPercentage,
                    p_description: description || undefined,
                    p_is_active: isActive
                };
                const { data: newPlanId, error: insertError } = await api.createManagementPlanAdmin(createParams);
                if (insertError) throw insertError;
                if (!newPlanId) throw new Error("Failed to get new plan ID after insertion.");
                showSuccessNotification("Plan Added", `Management plan added successfully! ID: ${newPlanId}`);
            }

            onSuccess();
            onClose();

        } catch (submitError: any) {
            console.error('Error submitting management plan:', submitError);
            const message = submitError?.message || submitError?.details || 'An unexpected error occurred.';
            setError(`Failed to save plan: ${message}`);
            showErrorNotification("Error saving plan", message);
        } finally {
            setLoading(false);
        }
    };

    const renderInput = (
        id: string, label: string, type: string, value: string | number | undefined,
        onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void,
        icon: React.ReactNode, placeholder?: string, required: boolean = false, rows?: number, min?: number, max?: number, step?: number
    ) => (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-gray-500">*</span>}
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    {icon}
                </div>
                {type === 'textarea' ? (
                    <textarea id={id} value={value ?? ''} onChange={onChange} rows={rows || 3}
                        className={`pl-10 ${getBaseInputClasses()}`} placeholder={placeholder}
                        required={required} disabled={loading} />
                ) : (
                    <input type={type} id={id} value={value ?? ''} onChange={onChange}
                        className={`pl-10 ${getBaseInputClasses()}`} placeholder={placeholder}
                        required={required} disabled={loading} min={min} max={max} step={step} />
                )}
            </div>
        </div>
    );

    return (
        <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900">
                    {isEditing ? 'Edit Management Plan' : 'Add New Management Plan'}
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
                {renderInput("name", "Card Header Title", "text", name, (e) => setName(e.target.value), <IconFileText className="h-4 w-4" />, "e.g., Tenant Placement & Transition", true)}
                <div>
                    {renderInput("description", "Subheadings & Bullet Points (Format: Subheading: Details)", "textarea", description, (e) => setDescription(e.target.value), <IconListDetails className="h-4 w-4" />, "Background Checks: Rigorous tenant verification and reference matching.\nExit Management: Complete move-out inspections.\nCost : Flat fee per placement.", false, 5)}
                    <p className="mt-1.5 text-[11px] text-gray-500 italic bg-amber-50 p-2 rounded border border-amber-200/60">
                        ✨ <b>Formatting guide:</b> Write each line as <span className="font-mono font-bold text-gray-800">Subheading: Description</span> to automatically display italicized subheadings, bold prefixes, and bullet point items matching your design.
                    </p>
                </div>
                <div className="flex items-center justify-between">
                    <span className="flex items-center text-sm font-medium text-gray-700">
                        <IconCheckbox className="h-4 w-4 mr-2 text-gray-400" />
                        Active Plan
                    </span>
                    <Switch
                        checked={isActive}
                        onChange={setIsActive}
                        disabled={loading}
                        className={`${isActive ? 'bg-gray-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2`}
                    >
                        <span className={`${isActive ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                    </Switch>
                </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end bg-gray-50">
                <div className="flex items-center space-x-3">
                    <button type="button" onClick={onClose} className={getSecondaryButtonClasses()} disabled={loading}>
                        Cancel
                    </button>
                    <button type="submit" className={getPrimaryButtonClasses()} disabled={loading}>
                        {loading ? (
                            <>
                                <LoadingSpinner size={16} className="mr-2" />
                                Saving...
                            </>
                        ) : (
                            isEditing ? 'Update Plan' : 'Add Plan'
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}

function ManagementPlanFormModal({ isOpen, onClose, plan, onSuccess }: ManagementPlanFormModalProps) {
    const key = plan?.plan_id || 'new';

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
                                {isOpen && (
                                    <ManagementPlanFormBody
                                        key={key}
                                        plan={plan}
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

export default ManagementPlanFormModal;