import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useState, useEffect, useCallback } from 'react';
import { IconX, IconHistory } from '@tabler/icons-react';
import { PropertyPaymentHistoryAdminResults } from '../lib/types';
import api from '../lib/supabaseClient';
import LoadingSpinner from './LoadingSpinner';
import { useNotification } from './NotificationProvider';
import { getSecondaryButtonClasses } from '../lib/twUtils';
import { formatTimestamp, formatDate } from '../lib/utils';

interface PropertyPaymentHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyId: string | null;
    propertyName: string | null;
}

function PropertyPaymentHistoryModal({ isOpen, onClose, propertyId, propertyName }: PropertyPaymentHistoryModalProps) {
    const [payments, setPayments] = useState<PropertyPaymentHistoryAdminResults>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { showErrorNotification } = useNotification();

    const fetchHistory = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        setPayments([]);
        try {
            const { data, error: fetchError } = await api.getPropertyPaymentHistoryLandlord({ p_property_id_input: id });
            if (fetchError) throw fetchError;
            setPayments(data || []);
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to load payment history.';
            setError(errMsg);
            showErrorNotification("Error Loading History", errMsg);
            setPayments([]);
        } finally {
            setLoading(false);
        }
    }, [showErrorNotification]);

    useEffect(() => {
        if (isOpen && propertyId) {
            fetchHistory(propertyId);
        }
    }, [isOpen, propertyId, fetchHistory]);


    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-20" onClose={onClose}>
                {/* Backdrop */}
                <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </TransitionChild>

                {/* Modal Panel */}
                <div className="fixed inset-0 z-20 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                            <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl">
                                {/* Header */}
                                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                                    <h2 className="text-lg font-medium text-gray-900 flex items-center">
                                        <IconHistory className='mr-2 text-gray-600' /> Payment History: {propertyName || 'Property'}
                                    </h2>
                                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors duration-200"><IconX className="h-5 w-5" /></button>
                                </div>

                                {/* Body */}
                                <div className="p-6 max-h-[60vh] overflow-y-auto">
                                    {loading && <div className='text-center p-10'><LoadingSpinner /></div>}
                                    {error && !loading && <div className="p-3 bg-red-50 border border-red-200 rounded-md"><p className="text-sm text-red-700">{error}</p></div>}

                                    {!loading && !error && payments.length === 0 && (
                                        <p className="text-center text-gray-500 italic py-8">No payment history found for this property.</p>
                                    )}

                                    {!loading && !error && payments.length > 0 && (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                                <thead className="bg-gray-50 sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Payment Date</th>
                                                        <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Amount Paid</th>
                                                        <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Method</th>
                                                        <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                                                        <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Period</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {payments.map(p => (
                                                        <tr key={p.payment_id}>
                                                            <td className="px-4 py-2 whitespace-nowrap">{formatTimestamp(p.payment_date)}</td>
                                                            <td className="px-4 py-2 whitespace-nowrap font-medium">₹{p.amount_paid.toLocaleString()}</td>
                                                            <td className="px-4 py-2 whitespace-nowrap">{p.payment_method || '-'}</td>
                                                            <td className="px-4 py-2 whitespace-nowrap">
                                                                <span title={`Email: ${p.tenant_email || '-'}\nPhone: ${p.tenant_phone || '-'}`}>{p.tenant_name || 'N/A'}</span>
                                                            </td>
                                                            <td className="px-4 py-2 whitespace-nowrap">{formatDate(p.rent_period_start_date)} - {formatDate(p.rent_period_end_date)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
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

export default PropertyPaymentHistoryModal;