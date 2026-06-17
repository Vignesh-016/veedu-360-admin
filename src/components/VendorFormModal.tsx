import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useState, useCallback, FormEvent, ChangeEvent, useEffect } from 'react';
import { IconX, IconBuildingSkyscraper, IconUser, IconPhone, IconMail, IconMapPin, IconListDetails, IconTools, IconAlertCircle, IconBuildingStore } from '@tabler/icons-react';
import { VendorAdminDetails, VendorStatus, ServiceAdminView } from '../lib/types';
import api from '../lib/supabaseClient';
import { useNotification } from './NotificationProvider';
import LoadingSpinner from './LoadingSpinner';
import { getBaseInputClasses, getPrimaryButtonClasses, getSecondaryButtonClasses } from '../lib/twUtils';
import * as displayUtils from '../lib/displayUtils';

const vendorStatusOptions = Object.entries(displayUtils.vendorStatusMap)
    .map(([value, label]) => ({ value: value as VendorStatus, label }));

interface VendorFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    vendor?: VendorAdminDetails | null;
    onSuccess: () => void;
}

interface VendorFormBodyProps {
    vendor?: VendorAdminDetails | null;
    onClose: () => void;
    onSuccess: () => void;
}

function VendorFormBody({ vendor, onClose, onSuccess }: VendorFormBodyProps) {
    const { showSuccessNotification, showErrorNotification } = useNotification();
    const isEditing = !!vendor;

    const [companyName, setCompanyName] = useState(vendor?.company_name || '');
    const [contactName, setContactName] = useState<string | undefined>(vendor?.contact_name ?? undefined);
    const [phone, setPhone] = useState<string | undefined>(vendor?.phone ?? undefined);
    const [email, setEmail] = useState<string | undefined>(vendor?.email ?? undefined);
    const [address, setAddress] = useState<string | undefined>(vendor?.address ?? undefined);
    const [status, setStatus] = useState<VendorStatus>(vendor?.status || 'ACTIVE');
    const [notes, setNotes] = useState<string | undefined>(vendor?.notes ?? undefined);
    const [availableServices, setAvailableServices] = useState<ServiceAdminView[]>([]);
    const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>(vendor?.services?.map(s => s.service_id) || []);

    const [loading, setLoading] = useState(false);
    const [servicesLoading, setServicesLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchServices = useCallback(async () => {
        setServicesLoading(true);
        try {
            const { data, error: servicesError } = await api.listServicesAdmin();
            if (servicesError) throw servicesError;
            setAvailableServices(data || []);
        } catch (err) {
            console.error('Error fetching services:', err);
            showErrorNotification('Error Fetching Services', 'Could not load available services.');
        } finally {
            setServicesLoading(false);
        }
    }, [showErrorNotification]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    const handleServiceChange = (serviceId: number, checked: boolean) => {
        setSelectedServiceIds(prev => checked ? [...prev, serviceId] : prev.filter(id => id !== serviceId));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const vendorData = {
            p_company_name: companyName, p_contact_name: contactName || undefined, p_phone: phone || undefined,
            p_email: email || undefined, p_address: address || undefined, p_status: status, p_notes: notes || undefined,
        };
        try {
            if (isEditing && vendor) {
                await api.updateVendorAdmin({ ...vendorData, p_vendor_id: vendor.vendor_id });
                const existingServiceIds = new Set(vendor.services?.map(s => s.service_id) || []);
                const newServiceIds = new Set(selectedServiceIds);
                const servicesToAdd = selectedServiceIds.filter(id => !existingServiceIds.has(id));
                const servicesToRemove = (vendor.services?.map(s => s.service_id) || []).filter(id => !newServiceIds.has(id));
                for (const serviceId of servicesToRemove) await api.removeServiceFromVendorAdmin(vendor.vendor_id, serviceId);
                for (const serviceId of servicesToAdd) await api.assignServiceToVendorAdmin(vendor.vendor_id, serviceId);
                showSuccessNotification("Vendor Updated", "Vendor updated successfully!");
            } else {
                const { data: newVendorId, error: insertError } = await api.createVendorAdmin({
                    ...vendorData, p_service_ids: selectedServiceIds.length > 0 ? selectedServiceIds : undefined,
                });
                if (insertError) throw insertError;
                if (!newVendorId) throw new Error("Failed to get new vendor ID after insertion.");
                showSuccessNotification("Vendor Added", `Vendor added successfully! ID: ${newVendorId}`);
            }
            onSuccess();
            onClose();
        } catch (submitError: any) {
            const message = submitError?.message || submitError?.details || 'An unexpected error occurred.';
            setError(`Failed to save vendor: ${message}`);
            showErrorNotification("Error saving vendor", message);
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
            <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label} {required && <span className="text-gray-500">*</span>}</label>
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
        id: string, label: string, value: string, onChange: (e: ChangeEvent<HTMLSelectElement>) => void,
        icon: React.ReactNode, options: { value: string; label: string }[], required: boolean = false
    ) => (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label} {required && <span className="text-gray-500">*</span>}</label>
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
                <h2 className="text-lg font-medium text-gray-900">{isEditing ? 'Edit Vendor' : 'Add New Vendor'}</h2>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors duration-200"><IconX className="h-5 w-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
                {error && (<div className="p-3 bg-gray-100 border border-gray-300 rounded-md"><p className="text-sm text-gray-700 flex items-center"><IconAlertCircle className="w-4 h-4 mr-2 text-gray-500" />{error}</p></div>)}
                <fieldset className="space-y-4 border border-gray-200 p-4 rounded-md">
                    <legend className="text-base font-medium text-gray-900 px-2">Vendor Information</legend>
                    <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6">
                        {renderInput("companyName", "Company Name", "text", companyName, (e) => setCompanyName(e.target.value), <IconBuildingStore className="h-4 w-4" />, "e.g., Reliable Repairs Co.", true)}
                        {renderInput("contactName", "Contact Name", "text", contactName, (e) => setContactName(e.target.value || undefined), <IconUser className="h-4 w-4" />, "e.g., John Doe")}
                        {renderInput("phone", "Phone", "tel", phone, (e) => setPhone(e.target.value || undefined), <IconPhone className="h-4 w-4" />, "e.g., +919876543210")}
                        {renderInput("email", "Email", "email", email, (e) => setEmail(e.target.value || undefined), <IconMail className="h-4 w-4" />, "e.g., contact@reliable.com")}
                        {renderInput("address", "Address", "textarea", address, (e) => setAddress(e.target.value || undefined), <IconMapPin className="h-4 w-4" />, "Full business address", false, 3)}
                        {renderSelect("status", "Status", status, (e) => setStatus(e.target.value as VendorStatus), <IconBuildingSkyscraper className="h-4 w-4" />, vendorStatusOptions, true)}
                    </div>
                    <div className="grid grid-cols-1">{renderInput("notes", "Internal Notes", "textarea", notes, (e) => setNotes(e.target.value || undefined), <IconListDetails className="h-4 w-4" />, "Any internal notes about this vendor...", false, 3)}</div>
                </fieldset>
                <fieldset className="space-y-4 border border-gray-200 p-4 rounded-md">
                    <legend className="text-base font-medium text-gray-900 px-2 flex items-center"><IconTools className="h-4 w-4 mr-2 text-gray-500" /> Assign Services {servicesLoading && <LoadingSpinner size={16} className='ml-2' />}</legend>
                    {availableServices.length > 0 ? (<div className="max-h-48 overflow-y-auto space-y-2 pr-2">{availableServices.map(service => (<div key={service.service_id} className="flex items-center"><input id={`service-${service.service_id}`} type="checkbox" checked={selectedServiceIds.includes(service.service_id)} onChange={(e) => handleServiceChange(service.service_id, e.target.checked)} className="h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500" disabled={loading || servicesLoading} /><label htmlFor={`service-${service.service_id}`} className="ml-2 block text-sm text-gray-700">{service.service_name} {service.category && <span className='text-xs text-gray-500 ml-1'>({displayUtils.serviceCategoryMap[service.category]})</span>}</label></div>))}</div>) : !servicesLoading ? (<p className="text-sm text-gray-500 italic">No services available. You may need to add services first.</p>) : null}
                </fieldset>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end bg-gray-50">
                <div className="flex items-center space-x-3">
                    <button type="button" onClick={onClose} className={getSecondaryButtonClasses()} disabled={loading}>Cancel</button>
                    <button type="submit" className={getPrimaryButtonClasses()} disabled={loading || servicesLoading}>{loading ? (<><LoadingSpinner size={16} className="mr-2" />Saving...</>) : (isEditing ? 'Update Vendor' : 'Add Vendor')}</button>
                </div>
            </div>
        </form>
    );
}


function VendorFormModal({ isOpen, onClose, vendor, onSuccess }: VendorFormModalProps) {
    const key = vendor?.vendor_id || 'new';

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={onClose}>
                <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                </TransitionChild>
                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                            <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                                {isOpen && (
                                    <VendorFormBody
                                        key={key}
                                        vendor={vendor}
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

export default VendorFormModal;