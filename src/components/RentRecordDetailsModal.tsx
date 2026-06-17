import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useState, useEffect, FormEvent, useCallback } from 'react';
import {
    IconX, IconBuildingSkyscraper, IconUser, IconCalendar, IconCurrencyRupee,
    IconNote, IconReceipt, IconPlus, IconTrash, IconLoader, IconCheck,
} from '@tabler/icons-react';
import { RentRecordAdminDetails, RentPaymentAdminView } from '../lib/types';
import api from '../lib/supabaseClient';
import { useNotification } from './NotificationProvider';
import LoadingSpinner from './LoadingSpinner';
import { getBaseInputClasses, getPrimaryButtonClasses, getSecondaryButtonClasses, getStatusBadgeClasses } from '../lib/twUtils';
import * as displayUtils from '../lib/displayUtils';
import { formatTimestamp, formatDate } from '../lib/utils';
import SearchableSelect from './SearchableSelect';

interface RentRecordDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    recordId: string | null;
    onSuccess?: () => void;
}

function RentRecordDetailsModal({ isOpen, onClose, recordId, onSuccess }: RentRecordDetailsModalProps) {
    const [record, setRecord] = useState<RentRecordAdminDetails | null>(null);
    const [payments, setPayments] = useState<RentPaymentAdminView[]>([]);
    const [loading, setLoading] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { showSuccessNotification, showErrorNotification } = useNotification();

    // Payment Form State
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState<number | string>('');
    const [paidByUserId, setPaidByUserId] = useState<string | undefined>(undefined);
    const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 16));
    const [paymentMethod, setPaymentMethod] = useState<string>('MANUAL_ADMIN');
    const [paymentNotes, setPaymentNotes] = useState<string>('');
    const [initialPaidByName, setInitialPaidByName] = useState<string | undefined>(undefined);

    const resetPaymentForm = () => {
        setShowPaymentForm(false);
        setPaymentAmount('');
        setPaidByUserId(undefined);
        setPaymentDate(new Date().toISOString().slice(0, 16));
        setPaymentMethod('MANUAL_ADMIN');
        setPaymentNotes('');
        setInitialPaidByName(undefined);
    };

    const fetchDetails = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        setRecord(null);
        setPayments([]);
        resetPaymentForm();
        setDeletingPaymentId(null);

        try {
            const { data: recordData, error: recordError } = await api.getRentRecordDetailsAdmin(id);
            if (recordError) throw recordError;
            if (!recordData) throw new Error("Rent record not found.");
            setRecord(recordData);
            setPayments(recordData.payments || []);
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to fetch rent record details.';
            setError(errMsg);
            showErrorNotification("Error Loading Details", errMsg);
        } finally {
            setLoading(false);
        }
    }, [showErrorNotification]);

    useEffect(() => {
        if (isOpen && recordId) {
            fetchDetails(recordId);
        }
    }, [isOpen, recordId, fetchDetails]);

    const handleRecordPayment = async (e: FormEvent) => {
        e.preventDefault();
        if (!record || !paidByUserId) return;
        setPaymentLoading(true);
        setError(null);

        const numericAmount = parseFloat(paymentAmount as string);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            showErrorNotification("Invalid Amount", "Payment amount must be a positive number.");
            setPaymentLoading(false);
            return;
        }

        const paymentDateUTC = new Date(paymentDate).toISOString();

        try {
            const { error: paymentError } = await api.recordRentPaymentAdmin({
                p_rent_record_id: record.rent_record_id,
                p_amount: numericAmount,
                p_paid_by_user_id: paidByUserId,
                p_payment_date: paymentDateUTC,
                p_payment_method: paymentMethod || undefined,
                p_notes: paymentNotes || undefined,
            });
            if (paymentError) throw paymentError;
            showSuccessNotification("Payment Recorded", "Rent payment successfully recorded.");
            resetPaymentForm();
            if (recordId) fetchDetails(recordId);
            if (onSuccess) onSuccess();
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to record payment.';
            setError(`Payment Error: ${errMsg}`);
            showErrorNotification("Payment Error", errMsg);
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleDeletePayment = async (paymentId: string) => {
        if (!record || deletingPaymentId) return;
        if (window.confirm('Are you sure you want to delete this payment? This will update the rent record status.')) {
            setDeletingPaymentId(paymentId);
            setError(null);
            try {
                const { error: deleteError } = await api.deleteRentPaymentAdmin(paymentId);
                if (deleteError) throw deleteError;
                showSuccessNotification("Payment Deleted", "Payment deleted successfully.");
                if (recordId) fetchDetails(recordId);
                if (onSuccess) onSuccess();
            } catch (err) {
                const errMsg = err instanceof Error ? err.message : 'Failed to delete payment.';
                setError(`Deletion Error: ${errMsg}`);
                showErrorNotification("Deletion Error", errMsg);
            } finally {
                setDeletingPaymentId(null);
            }
        }
    };

    const renderDetail = (label: string, value: string | number | null | undefined, icon?: React.ReactNode, isDate = false, isTimestamp = false) => {
        if (value === null || value === undefined || value === '') return null;
        let displayValue: string | number = value;
        if (isDate) displayValue = formatDate(value as string);
        if (isTimestamp) displayValue = formatTimestamp(value as string);
        if (typeof value === 'number') displayValue = value.toLocaleString();
        if (label.toLowerCase().includes('amount')) displayValue = `₹${displayValue}`;

        return (
            <div className="flex items-start space-x-2">
                {icon && <span className="text-gray-500 mt-0.5 flex-shrink-0">{icon}</span>}
                <div>
                    <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wider">{label}</h4>
                    <p className="text-gray-800 text-sm">{displayValue}</p>
                </div>
            </div>
        );
    };

    const fetchUserOptions = async (query: string): Promise<{ value: string; label: string }[]> => {
        const { data, error: userError } = await api.searchCustomers(query, undefined, 0, 20);
        if (userError) {
            console.error("Error fetching users:", userError);
            showErrorNotification("User Search Error", "Could not load users.");
            return [];
        }
        return (data || []).map((user) => ({
            value: user.user_id,
            label: `${user.full_name ?? 'N/A'} (${user.email ?? 'No Email'})`,
        }));
    };


    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={onClose}>
                {/* Backdrop */}
                <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                </TransitionChild>

                {/* Modal Panel */}
                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                            <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl">
                                {/* Header */}
                                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                                    <h2 className="text-lg font-medium text-gray-900 flex items-center">
                                        <IconReceipt className='mr-2 text-gray-600' /> Rent Record Details
                                    </h2>
                                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors duration-200"><IconX className="h-5 w-5" /></button>
                                </div>

                                {/* Body */}
                                <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                                    {loading && <div className='text-center p-10'><LoadingSpinner /></div>}
                                    {error && !loading && <div className="p-3 bg-red-50 border border-red-200 rounded-md"><p className="text-sm text-red-700">{error}</p></div>}

                                    {record && !loading && (
                                        <>
                                            {/* Record Info */}
                                            <div className="border border-gray-200 rounded-md p-4">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h3 className="text-base font-semibold text-gray-800">Record Information</h3>
                                                    <span className={getStatusBadgeClasses(record.status)}>{displayUtils.getDisplayValue(displayUtils.rentStatusMap, record.status)}</span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {renderDetail("Property", record.property_address, <IconBuildingSkyscraper size={16} />)}
                                                    {renderDetail("Tenant", `${record.tenant_name || 'N/A'} (${record.tenant_phone || 'No Phone'})`, <IconUser size={16} />)}
                                                    {renderDetail("Landlord", `${record.landlord_name || 'N/A'} (${record.landlord_phone || 'No Phone'})`, <IconUser size={16} />)}
                                                    {renderDetail("Due Date", record.due_date, <IconCalendar size={16} />, true)}
                                                    {renderDetail("Period Start", record.period_start_date, <IconCalendar size={16} />, true)}
                                                    {renderDetail("Period End", record.period_end_date, <IconCalendar size={16} />, true)}
                                                    {renderDetail("Amount Due", record.amount_due, <IconCurrencyRupee size={16} />)}
                                                    {renderDetail("Amount Paid", record.amount_paid, <IconCurrencyRupee size={16} />)}
                                                    {renderDetail("Balance", record.amount_due - record.amount_paid, <IconCurrencyRupee size={16} />)}
                                                    {renderDetail("Record ID", record.rent_record_id.substring(0, 12) + '...', <IconReceipt size={16} />)}
                                                </div>
                                                {record.notes && <div className="mt-3 pt-3 border-t border-gray-100">{renderDetail("Notes", record.notes, <IconNote size={16} />)}</div>}
                                            </div>

                                            {/* Payments Section */}
                                            <div className="border border-gray-200 rounded-md p-4">
                                                <div className="flex justify-between items-center mb-3">
                                                    <h3 className="text-base font-semibold text-gray-800">Payments</h3>
                                                    <button onClick={() => setShowPaymentForm(!showPaymentForm)} className={getSecondaryButtonClasses()}><IconPlus className="mr-1" size={16} /> Record Payment</button>
                                                </div>

                                                {/* Payment Form */}
                                                {showPaymentForm && (
                                                    <form onSubmit={handleRecordPayment} className="bg-gray-50 p-4 rounded border border-gray-200 mb-4 space-y-3">
                                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Record New Payment</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <SearchableSelect
                                                                label="Paid By User"
                                                                value={paidByUserId}
                                                                onChange={(value) => setPaidByUserId(value as string | undefined)}
                                                                fetchOptions={fetchUserOptions}
                                                                placeholder="Search User (Tenant or Other)..."
                                                                icon={<IconUser size={16} />}
                                                                required
                                                                initialDisplayValue={initialPaidByName}
                                                            />
                                                            <div>
                                                                <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700">Amount (INR)</label>
                                                                <input type="number" id="paymentAmount" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} required min="0.01" step="0.01" className={getBaseInputClasses()} />
                                                            </div>
                                                            <div>
                                                                <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700">Payment Date/Time (Local)</label>
                                                                <input type="datetime-local" id="paymentDate" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required className={getBaseInputClasses()} />
                                                            </div>
                                                            <div>
                                                                <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">Payment Method</label>
                                                                <input type="text" id="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={getBaseInputClasses()} placeholder="e.g., Bank Transfer, Cash" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label htmlFor="paymentNotes" className="block text-sm font-medium text-gray-700">Payment Notes</label>
                                                            <textarea id="paymentNotes" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} rows={2} className={getBaseInputClasses()} placeholder="Optional notes..." />
                                                        </div>
                                                        <div className="flex justify-end space-x-2">
                                                            <button type="button" onClick={() => setShowPaymentForm(false)} className={getSecondaryButtonClasses()} disabled={paymentLoading}>Cancel</button>
                                                            <button type="submit" className={getPrimaryButtonClasses()} disabled={paymentLoading || !paidByUserId}>
                                                                {paymentLoading ? <LoadingSpinner size={16} className="mr-1" /> : <IconCheck size={16} className="mr-1" />} Save Payment
                                                            </button>
                                                        </div>
                                                    </form>
                                                )}

                                                {/* Payments Table */}
                                                {payments.length > 0 ? (
                                                    <div className="overflow-x-auto max-h-60">
                                                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                                                            <thead className="bg-gray-50 sticky top-0">
                                                                <tr>
                                                                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Paid By</th>
                                                                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Method</th>
                                                                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                                                                    <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider"></th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                                {payments.map(p => (
                                                                    <tr key={p.payment_id} className="hover:bg-gray-50">
                                                                        <td className="px-3 py-2 whitespace-nowrap font-medium">₹{p.amount.toLocaleString()}</td>
                                                                        <td className="px-3 py-2 whitespace-nowrap">{p.paid_by_name}</td>
                                                                        <td className="px-3 py-2 whitespace-nowrap">{formatTimestamp(p.payment_date)}</td>
                                                                        <td className="px-3 py-2 whitespace-nowrap">{p.payment_method || '-'}</td>
                                                                        <td className="px-3 py-2 max-w-xs truncate" title={p.notes ?? ''}>{p.notes || '-'}</td>
                                                                        <td className="px-3 py-2 whitespace-nowrap text-right">
                                                                            <button onClick={() => handleDeletePayment(p.payment_id)} className="text-gray-400 hover:text-red-600 p-0.5 disabled:opacity-50" title="Delete Payment" disabled={deletingPaymentId === p.payment_id}>{deletingPaymentId === p.payment_id ? <IconLoader size={14} className="animate-spin" /> : <IconTrash size={14} />}</button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-500 italic text-center py-4">No payments recorded for this period yet.</p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Footer */}
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

export default RentRecordDetailsModal;