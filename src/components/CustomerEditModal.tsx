import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { IconX, IconAlertCircle } from '@tabler/icons-react';
import api from '../lib/supabaseClient';
import { CustomerFullDetailsAdmin } from '../lib/types';
import { useNotification } from './NotificationProvider';
import LoadingSpinner from './LoadingSpinner';

interface CustomerEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer: CustomerFullDetailsAdmin | null;
    onSuccess: () => void;
}

interface CustomerEditFormBodyProps {
    customer: CustomerFullDetailsAdmin;
    onClose: () => void;
    onSuccess: () => void;
}

function CustomerEditFormBody({ customer, onClose, onSuccess }: CustomerEditFormBodyProps) {
    const [visitBalance, setVisitBalance] = useState<number>(customer.visit_balance || 0);
    const [contactBalance, setContactBalance] = useState<number>(customer.contact_balance ?? 0);
    const [listingQuota, setListingQuota] = useState<number>((customer as any).listing_quota ?? 1);
    const [expiryDate, setExpiryDate] = useState<string>(
        customer.expiry_date ? new Date(customer.expiry_date).toISOString().slice(0, 10) : ''
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { showSuccessNotification, showErrorNotification } = useNotification();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Run all updates in parallel; collect results to surface any error
            const [visitsResult, contactResult, listingQuotaResult] = await Promise.allSettled([
                api.updateCustomerVisits(customer.user_id, visitBalance, expiryDate || ''),
                api.updateCustomerContactBalance(customer.user_id, contactBalance),
                api.updateCustomerListingQuota(customer.user_id, listingQuota),
            ]);

            const errors: string[] = [];

            if (visitsResult.status === 'rejected') {
                errors.push(`Visits/Expiry: ${visitsResult.reason?.message ?? 'Unknown error'}`);
            } else if (visitsResult.value.error) {
                const err = visitsResult.value.error;
                errors.push(`Visits/Expiry: ${typeof err === 'string' ? err : err.message}`);
            }

            if (contactResult.status === 'rejected') {
                errors.push(`Contact Balance: ${contactResult.reason?.message ?? 'Unknown error'}`);
            } else if (contactResult.value.error) {
                const err = contactResult.value.error;
                errors.push(`Contact Balance: ${typeof err === 'string' ? err : err.message}`);
            }

            if (listingQuotaResult.status === 'rejected') {
                errors.push(`Listing Quota: ${listingQuotaResult.reason?.message ?? 'Unknown error'}`);
            } else if (listingQuotaResult.value.error) {
                const err = listingQuotaResult.value.error;
                errors.push(`Listing Quota: ${typeof err === 'string' ? err : err.message}`);
            }

            if (errors.length > 0) {
                const combinedError = errors.join(' | ');
                setError(combinedError);
                showErrorNotification('Update Error', combinedError);
                return;
            }

            showSuccessNotification('Customer Updated', 'Credits and expiry updated successfully!');
            onSuccess();
            onClose();
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to update customer details';
            setError(errMsg);
            showErrorNotification('Error updating customer', errMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900">
                    Edit Credits &amp; Expiry — <span className="text-gray-500 font-normal">{customer.full_name}</span>
                </h2>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
                >
                    <IconX className="h-5 w-5" />
                </button>
            </div>

            <div className="px-6 py-5 space-y-5">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-700 flex items-start gap-2">
                            <IconAlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                            <span>{error}</span>
                        </p>
                    </div>
                )}

                {/* Visit Balance */}
                <div>
                    <label htmlFor="visitBalance" className="block text-sm font-medium text-gray-700 mb-1">
                        Visit Balance
                        <span className="text-xs text-gray-400 font-normal ml-1">(number of visit credits)</span>
                    </label>
                    <input
                        type="number"
                        id="visitBalance"
                        min="0"
                        value={visitBalance}
                        onChange={(e) => setVisitBalance(Math.max(0, Number(e.target.value)))}
                        className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D9A619] focus:border-[#D9A619] sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                        disabled={loading}
                    />
                </div>

                {/* Contact Balance */}
                <div>
                    <label htmlFor="contactBalance" className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Balance
                        <span className="text-xs text-gray-400 font-normal ml-1">(number of contact unlock credits)</span>
                    </label>
                    <input
                        type="number"
                        id="contactBalance"
                        min="0"
                        value={contactBalance}
                        onChange={(e) => setContactBalance(Math.max(0, Number(e.target.value)))}
                        className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D9A619] focus:border-[#D9A619] sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                        disabled={loading}
                    />
                </div>

                {/* Property Listing Quota */}
                <div>
                    <label htmlFor="listingQuota" className="block text-sm font-medium text-gray-700 mb-1">
                        Property Listing Quota
                        <span className="text-xs text-gray-400 font-normal ml-1">(free property postings limit)</span>
                    </label>
                    <input
                        type="number"
                        id="listingQuota"
                        min="0"
                        value={listingQuota}
                        onChange={(e) => setListingQuota(Math.max(0, Number(e.target.value)))}
                        className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D9A619] focus:border-[#D9A619] sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                        disabled={loading}
                    />
                </div>

                {/* Expiry Date */}
                <div>
                    <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Plan Expiry Date
                        <span className="text-xs text-gray-400 font-normal ml-1">(leave blank to clear)</span>
                    </label>
                    <input
                        type="date"
                        id="expiryDate"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D9A619] focus:border-[#D9A619] sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                        disabled={loading}
                    />
                </div>

                {/* Summary banner */}
                <div className="bg-amber-50 border border-amber-200 rounded-md px-4 py-3 text-xs text-amber-800 space-y-1">
                    <p className="font-semibold">Current values</p>
                    <p>Visit Balance: <span className="font-medium">{customer.visit_balance ?? 0}</span></p>
                    <p>Contact Balance: <span className="font-medium">{customer.contact_balance ?? 0}</span></p>
                    <p>Property Listing Quota: <span className="font-medium">{(customer as any).listing_quota ?? 1}</span></p>
                    <p>Expiry: <span className="font-medium">{customer.expiry_date ? new Date(customer.expiry_date).toLocaleDateString('en-IN') : '—'}</span></p>
                </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 bg-gray-50">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                    disabled={loading}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-[#D9A619] border border-transparent rounded-md hover:bg-[#8F6F1B] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D9A619] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    disabled={loading}
                >
                    {loading ? (
                        <span className="flex items-center gap-1.5">
                            <LoadingSpinner />
                            <span>Saving...</span>
                        </span>
                    ) : (
                        'Save Changes'
                    )}
                </button>
            </div>
        </form>
    );
}


function CustomerEditModal({ isOpen, onClose, customer, onSuccess }: CustomerEditModalProps) {
    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={onClose}>
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                </TransitionChild>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                                {isOpen && customer && (
                                    <CustomerEditFormBody
                                        key={customer.user_id}
                                        customer={customer}
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

export default CustomerEditModal;