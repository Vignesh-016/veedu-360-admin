import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useState, FormEvent, ChangeEvent } from 'react';
import { IconX, IconTools, IconFileDescription, IconCategory, IconAlertCircle } from '@tabler/icons-react';
import { ServiceAdminView, ServiceCategory, CreateServiceAdminParams, UpdateServiceAdminParams } from '../lib/types';
import api from '../lib/supabaseClient';
import { useNotification } from './NotificationProvider';
import LoadingSpinner from './LoadingSpinner';
import { getBaseInputClasses, getPrimaryButtonClasses, getSecondaryButtonClasses } from '../lib/twUtils';
import * as displayUtils from '../lib/displayUtils';

const serviceCategoryOptions = [
    { value: '', label: 'Select Category (Optional)' },
    ...Object.entries(displayUtils.serviceCategoryMap).map(([value, label]) => ({ value: value as ServiceCategory, label }))
];

interface ServiceFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    service?: ServiceAdminView | null;
    onSuccess: () => void;
}

interface ServiceFormBodyProps {
    service?: ServiceAdminView | null;
    onClose: () => void;
    onSuccess: () => void;
}

function ServiceFormBody({ service, onClose, onSuccess }: ServiceFormBodyProps) {
    const { showSuccessNotification, showErrorNotification } = useNotification();
    const isEditing = !!service;

    const [serviceName, setServiceName] = useState(service?.service_name || '');
    const [description, setDescription] = useState<string>(service?.description || '');
    const [category, setCategory] = useState<ServiceCategory | ''>(service?.category || '');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isEditing && service) {
                const updateParams: UpdateServiceAdminParams = {
                    p_service_id: service.service_id,
                    p_service_name: serviceName,
                    p_description: description || undefined,
                    p_category: category || undefined,
                };
                const { error: updateError } = await api.updateServiceAdmin(updateParams);
                if (updateError) throw updateError;
                showSuccessNotification("Service Updated", "Service updated successfully!");
            } else {
                const createParams: CreateServiceAdminParams = {
                    p_service_name: serviceName,
                    p_description: description || undefined,
                    p_category: category || undefined,
                };
                const { data: newServiceId, error: insertError } = await api.createServiceAdmin(createParams);
                if (insertError) throw insertError;
                if (!newServiceId) throw new Error("Failed to get new service ID after insertion.");
                showSuccessNotification("Service Added", `Service added successfully! ID: ${newServiceId}`);
            }

            onSuccess();
            onClose();

        } catch (submitError: any) {
            console.error('Error submitting service:', submitError);
            const message = submitError?.message || submitError?.details || 'An unexpected error occurred.';
            setError(`Failed to save service: ${message}`);
            showErrorNotification("Error saving service", message);
        } finally {
            setLoading(false);
        }
    };

    const renderInput = (
        id: string, label: string, type: string, value: string | undefined,
        onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void,
        icon: React.ReactNode, placeholder?: string, required: boolean = false, rows?: number
    ) => (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">{icon}</div>
                {type === 'textarea' ? (
                    <textarea id={id} value={value ?? ''} onChange={onChange} rows={rows || 3} className={`pl-10 ${getBaseInputClasses()}`} placeholder={placeholder} required={required} disabled={loading} />
                ) : (
                    <input type={type} id={id} value={value ?? ''} onChange={onChange} className={`pl-10 ${getBaseInputClasses()}`} placeholder={placeholder} required={required} disabled={loading} />
                )}
            </div>
        </div>
    );

    const renderSelect = (
        id: string, label: string, value: string,
        onChange: (e: ChangeEvent<HTMLSelectElement>) => void,
        icon: React.ReactNode, options: { value: string; label: string }[],
        required: boolean = false
    ) => (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">{icon}</div>
                <select id={id} value={value} onChange={onChange} className={`pl-10 ${getBaseInputClasses()}`} required={required} disabled={loading} >
                    {options.map(option => (<option key={option.value} value={option.value}>{option.label}</option>))}
                </select>
            </div>
        </div>
    );

    return (
        <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900">{isEditing ? 'Edit Service' : 'Add New Service'}</h2>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors duration-200"><IconX className="h-5 w-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-6">
                {error && (<div className="p-3 bg-red-50 border border-red-200 rounded-md"><p className="text-sm text-red-700 flex items-center"><IconAlertCircle className="w-4 h-4 mr-2 text-red-500" />{error}</p></div>)}
                {renderInput("serviceName", "Service Name", "text", serviceName, (e) => setServiceName(e.target.value), <IconTools className="h-4 w-4" />, "e.g., Plumbing Repair", true)}
                {renderInput("description", "Description", "textarea", description, (e) => setDescription(e.target.value), <IconFileDescription className="h-4 w-4" />, "Describe the service...", false, 3)}
                {renderSelect("category", "Category", category, (e) => setCategory(e.target.value as ServiceCategory | ''), <IconCategory className="h-4 w-4" />, serviceCategoryOptions)}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end bg-gray-50">
                <div className="flex items-center space-x-3">
                    <button type="button" onClick={onClose} className={getSecondaryButtonClasses()} disabled={loading}>Cancel</button>
                    <button type="submit" className={getPrimaryButtonClasses()} disabled={loading}>
                        {loading ? (<><LoadingSpinner size={16} className="mr-2" />Saving...</>) : (isEditing ? 'Update Service' : 'Add Service')}
                    </button>
                </div>
            </div>
        </form>
    );
}

function ServiceFormModal({ isOpen, onClose, service, onSuccess }: ServiceFormModalProps) {
    const key = service?.service_id || 'new';

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
                                    <ServiceFormBody
                                        key={key}
                                        service={service}
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

export default ServiceFormModal;