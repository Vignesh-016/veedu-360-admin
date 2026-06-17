import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useState, FormEvent, ChangeEvent, useCallback } from 'react';
import {
    IconX, IconBuildingSkyscraper, IconUser, IconCalendar,
    IconCurrencyRupee, IconNote, IconAlertCircle, IconFileCheck,
    IconListCheck
} from '@tabler/icons-react';
import { RentRecordAdminSummary, RentStatus, AdminPropertySummary, ListingType, UpdateRentRecordAdminParams, CreateRentRecordAdminParams } from '../lib/types';
import api from '../lib/supabaseClient';
import { useNotification } from './NotificationProvider';
import LoadingSpinner from './LoadingSpinner';
import { getBaseInputClasses, getPrimaryButtonClasses, getSecondaryButtonClasses } from '../lib/twUtils';
import * as displayUtils from '../lib/displayUtils';
import SearchableSelect from './SearchableSelect';

const rentStatusOptions: { value: RentStatus; label: string }[] = Object.entries(displayUtils.rentStatusMap)
    .map(([value, label]) => ({ value: value as RentStatus, label }));

interface RentRecordFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    record?: RentRecordAdminSummary | null;
    onSuccess: () => void;
}

interface RentRecordFormBodyProps {
    record?: RentRecordAdminSummary | null;
    onClose: () => void;
    onSuccess: () => void;
}

function RentRecordFormBody({ record, onClose, onSuccess }: RentRecordFormBodyProps) {
    const { showSuccessNotification, showErrorNotification } = useNotification();
    const isEditing = !!record;

    const [propertyId, setPropertyId] = useState<string | undefined>(record?.property_id);
    const [dueDate, setDueDate] = useState<string>(record?.due_date || '');
    const [periodStartDate, setPeriodStartDate] = useState<string>(record?.period_start_date || '');
    const [periodEndDate, setPeriodEndDate] = useState<string>(record?.period_end_date || '');
    const [amountDue, setAmountDue] = useState<number | string>(record?.amount_due.toString() || '');
    const [notes, setNotes] = useState<string | undefined>(record?.notes ?? undefined);
    const [status, setStatus] = useState<RentStatus | undefined>(record?.status);
    const [amountPaid, setAmountPaid] = useState<number | string>(record?.amount_paid.toString() || '');
    const [tenantInfo, setTenantInfo] = useState<string | null>(record ? record.tenant_name : null);
    const [landlordInfo, setLandlordInfo] = useState<string | null>(record ? record.landlord_name : null);
    const [initialPropertyDisplay] = useState<string | undefined>(record?.property_address);

    const [loading, setLoading] = useState(false);
    const [propertyLoading, setPropertyLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPropertyOccupantDetails = useCallback(async (selectedPropertyId: string) => {
        if (!selectedPropertyId) {
            setTenantInfo(null);
            setLandlordInfo(null);
            return;
        }
        setPropertyLoading(true);
        setError(null);
        try {
            const { data: propDetails, error: propError } = await api.getPropertyDetailsAdmin(selectedPropertyId);
            if (propError) throw propError;
            if (!propDetails) throw new Error("Property details not found.");

            if (!propDetails.tenant_info?.user_id) {
                setError("Selected property is not occupied by a tenant, or tenant details are missing.");
                setTenantInfo(null);
            } else {
                setTenantInfo(propDetails.tenant_info.email || propDetails.tenant_info.name || `ID: ${propDetails.tenant_info.user_id.substring(0, 8)}...`);
                setError(null);
            }

            if (!propDetails.submitter_info?.user_id) {
                setError(prev => prev ? `${prev}\nProperty owner (landlord) not found.` : "Property owner (landlord) not found.");
                setLandlordInfo(null);
            } else {
                setLandlordInfo(propDetails.submitter_info.email || propDetails.submitter_info.name || `ID: ${propDetails.submitter_info.user_id.substring(0, 8)}...`);
            }
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to fetch property details.';
            setError(errMsg);
            showErrorNotification("Property Load Error", errMsg);
            setTenantInfo(null);
            setLandlordInfo(null);
        } finally {
            setPropertyLoading(false);
        }
    }, [showErrorNotification]);

    const handlePropertyChange = (newPropertyId: string | undefined) => {
        setPropertyId(newPropertyId);
        if (newPropertyId && !isEditing) {
            fetchPropertyOccupantDetails(newPropertyId);
        } else if (!newPropertyId) {
            setTenantInfo(null);
            setLandlordInfo(null);
            setError(null);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const numericAmountDue = parseFloat(amountDue as string);
        const numericAmountPaid = isEditing ? parseFloat(amountPaid as string) : 0;

        if (isNaN(numericAmountDue) || numericAmountDue <= 0) {
            setError("Amount Due must be a positive number.");
            setLoading(false);
            return;
        }
        if (isEditing && (isNaN(numericAmountPaid) || numericAmountPaid < 0)) {
            setError("Amount Paid must be a non-negative number.");
            setLoading(false);
            return;
        }

        try {
            if (isEditing && record) {
                const updateParams: UpdateRentRecordAdminParams = {
                    p_rent_record_id: record.rent_record_id,
                    p_due_date: dueDate || undefined,
                    p_period_start_date: periodStartDate || undefined,
                    p_period_end_date: periodEndDate || undefined,
                    p_amount_due: numericAmountDue,
                    p_amount_paid: numericAmountPaid,
                    p_status: status,
                    p_notes: notes || undefined,
                };
                const { error: updateError } = await api.updateRentRecordAdmin(updateParams);
                if (updateError) throw updateError;
                showSuccessNotification("Record Updated", "Rent record updated successfully!");
            } else {
                if (!propertyId || !tenantInfo || !landlordInfo) {
                    throw new Error("Please select a valid property with an assigned tenant and owner.");
                }
                const createParams: CreateRentRecordAdminParams = {
                    p_property_id: propertyId, p_due_date: dueDate, p_period_start_date: periodStartDate,
                    p_period_end_date: periodEndDate, p_amount_due: numericAmountDue, p_notes: notes || undefined,
                };
                const { data: newRecordId, error: insertError } = await api.createRentRecordAdmin(createParams);
                if (insertError) throw insertError;
                if (!newRecordId) throw new Error("Failed to get new record ID after insertion.");
                showSuccessNotification("Record Added", `Rent record added successfully! ID: ${newRecordId}`);
            }
            onSuccess();
            onClose();
        } catch (submitError: any) {
            console.error('Error submitting rent record:', submitError);
            const message = submitError?.message || submitError?.details || 'An unexpected error occurred.';
            setError(`Failed to save record: ${message}`);
            showErrorNotification("Error saving record", message);
        } finally {
            setLoading(false);
        }
    };

    const renderInput = (id: string, label: string, type: string, value: string | number | undefined, onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void, icon: React.ReactNode, placeholder?: string, required: boolean = false, rows?: number, disabled: boolean = false) => (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label} {required && <span className="text-red-500">*</span>}</label>
            <div className="mt-1 relative rounded-md shadow-sm">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>{icon}</div>
                {type === 'textarea' ? (<textarea id={id} value={value ?? ''} onChange={onChange} rows={rows || 3} className={`pl-10 ${getBaseInputClasses()} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`} placeholder={placeholder} required={required} disabled={loading || disabled} />)
                    : (<input type={type} id={id} value={value ?? ''} onChange={onChange} className={`pl-10 ${getBaseInputClasses()} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`} placeholder={placeholder} required={required} disabled={loading || disabled} step={type === 'number' ? '0.01' : undefined} min={type === 'number' ? '0' : undefined} />)}
            </div>
        </div>
    );

    const renderSelect = (id: string, label: string, value: string | undefined, onChange: (e: ChangeEvent<HTMLSelectElement>) => void, icon: React.ReactNode, options: { value: string; label: string }[], required: boolean = false, disabled: boolean = false) => (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label} {required && <span className="text-red-500">*</span>}</label>
            <div className="mt-1 relative rounded-md shadow-sm">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>{icon}</div>
                <select id={id} value={value ?? ''} onChange={onChange} className={`pl-10 ${getBaseInputClasses()} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`} required={required} disabled={loading || disabled}>
                    {options.map(option => (<option key={option.value} value={option.value}>{option.label}</option>))}
                </select>
            </div>
        </div>
    );

    const fetchPropertyOptions = async (query: string): Promise<{ value: string; label: string }[]> => {
        const { data, error: propError } = await api.getPropertiesAdmin({ p_property_search: query, p_listing_types: ['RENTAL'] as ListingType[], p_limit: 20 });
        if (propError) {
            console.error("Error fetching properties:", propError);
            showErrorNotification("Property Search Error", "Could not load properties.");
            return [];
        }
        return (data || []).map((prop: AdminPropertySummary) => ({
            value: prop.property_id,
            label: `${prop.address}, ${prop.city} ${prop.tenant_info ? `(Occupied by ${prop.tenant_info.name} +${prop.tenant_info.phone})` : '(Vacant)'}`,
        }));
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900">{isEditing ? 'Edit Rent Record' : 'Add New Rent Record'}</h2>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors duration-200"><IconX className="h-5 w-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-6">
                {error && (<div className="p-3 bg-red-50 border border-red-200 rounded-md"><p className="text-sm text-red-700 flex items-center"><IconAlertCircle className="w-4 h-4 mr-2 text-red-500" />{error}</p></div>)}
                <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6">
                    <SearchableSelect
                        label="Property"
                        value={propertyId}
                        onChange={(value) => handlePropertyChange(value as string | undefined)}
                        fetchOptions={fetchPropertyOptions}
                        placeholder="Search Property Address..."
                        icon={<IconBuildingSkyscraper size={16} />}
                        disabled={isEditing || loading || propertyLoading}
                        required={!isEditing}
                        initialDisplayValue={isEditing ? initialPropertyDisplay : undefined}
                    />
                    <div className="flex items-center pt-6">
                        {propertyLoading && <LoadingSpinner size={16} className="mr-2" />}
                        {!propertyLoading && tenantInfo && <span className="text-sm text-green-700 flex items-center"><IconUser size={16} className='mr-1' /> Tenant: {tenantInfo}</span>}
                        {!propertyLoading && landlordInfo && <span className="text-sm text-blue-700 ml-4 flex items-center"><IconUser size={16} className='mr-1' /> Landlord: {landlordInfo}</span>}
                        {!propertyLoading && !tenantInfo && propertyId && !error && <span className="text-sm text-yellow-600">No Tenant Found.</span>}
                        {!propertyLoading && !landlordInfo && propertyId && !error && <span className="text-sm text-yellow-600 ml-2">No Landlord Found.</span>}
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-3 sm:gap-x-6">
                    {renderInput("dueDate", "Due Date", "date", dueDate, (e) => setDueDate(e.target.value), <IconCalendar className="h-4 w-4" />, "", true)}
                    {renderInput("periodStartDate", "Period Start Date", "date", periodStartDate, (e) => setPeriodStartDate(e.target.value), <IconCalendar className="h-4 w-4" />, "", true)}
                    {renderInput("periodEndDate", "Period End Date", "date", periodEndDate, (e) => setPeriodEndDate(e.target.value), <IconCalendar className="h-4 w-4" />, "", true)}
                </div>
                <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-3 sm:gap-x-6">
                    {renderInput("amountDue", "Amount Due (INR)", "number", amountDue, (e) => setAmountDue(e.target.value), <IconCurrencyRupee className="h-4 w-4" />, "e.g., 15000.00", true)}
                    {renderInput("amountPaid", "Amount Paid (INR)", "number", amountPaid, (e) => setAmountPaid(e.target.value), <IconFileCheck className="h-4 w-4" />, "e.g., 15000.00", isEditing, undefined, !isEditing)}
                    {renderSelect("status", "Status", status, (e) => setStatus(e.target.value as RentStatus), <IconListCheck className="h-4 w-4" />, rentStatusOptions, isEditing, !isEditing)}
                </div>
                {renderInput("notes", "Notes", "textarea", notes, (e) => setNotes(e.target.value || undefined), <IconNote className="h-4 w-4" />, "Optional notes...", false, 3)}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end bg-gray-50">
                <div className="flex items-center space-x-3">
                    <button type="button" onClick={onClose} className={getSecondaryButtonClasses()} disabled={loading}>Cancel</button>
                    <button type="submit" className={getPrimaryButtonClasses()} disabled={loading || propertyLoading || (!isEditing && (!tenantInfo || !landlordInfo))}>
                        {loading ? (<><LoadingSpinner size={16} className="mr-2" />Saving...</>) : (isEditing ? 'Update Record' : 'Add Record')}
                    </button>
                </div>
            </div>
        </form>
    );
}

function RentRecordFormModal({ isOpen, onClose, record, onSuccess }: RentRecordFormModalProps) {
    const key = record?.rent_record_id || 'new';

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
                                    <RentRecordFormBody
                                        key={key}
                                        record={record}
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

export default RentRecordFormModal;