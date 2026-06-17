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
    const [expiryDate, setExpiryDate] = useState<string>(customer.expiry_date ? new Date(customer.expiry_date).toISOString().slice(0, 10) : '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { showSuccessNotification, showErrorNotification } = useNotification();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: updateError } = await api.updateCustomerVisits(customer.user_id, visitBalance, expiryDate || '');

            if (updateError) {
                throw new Error(typeof updateError === 'string' ? updateError : updateError.message);
            }

            showSuccessNotification("Customer Updated", "Customer visits/expiry updated successfully!");
            onSuccess();
            onClose();
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to update customer details';
            setError(errMsg);
            showErrorNotification("Error updating customer", errMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900">
                    Edit Visits & Expiry ({customer.full_name})
                </h2>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
                >
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
                    <label htmlFor="visitBalance" className="block text-sm font-medium text-gray-700">
                        Visit Balance
                    </label>
                    <input
                        type="number"
                        id="visitBalance"
                        min="0"
                        value={visitBalance}
                        onChange={(e) => setVisitBalance(Math.max(0, Number(e.target.value)))}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                        disabled={loading}
                    />
                </div>
                <div>
                    <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">
                        Expiry Date
                    </label>
                    <input
                        type="date"
                        id="expiryDate"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                        disabled={loading}
                    />
                </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end bg-gray-50">
                <div className="flex items-center space-x-3">
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
                        className="px-4 py-2 text-sm font-medium text-white bg-[#D9A619] border border-transparent rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D9A619] disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center">
                                <LoadingSpinner />
                                <span className="ml-1">Saving...</span>
                            </span>
                        ) : (
                            'Update Visits/Expiry'
                        )}
                    </button>
                </div>
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