import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { IconX, IconAlertCircle } from '@tabler/icons-react';
import api from '../lib/supabaseClient';
import { CustomerFullDetailsAdmin, VisitCreditBatchAdmin } from '../lib/types';
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
    const [expiryDate] = useState<string>(
        customer.expiry_date ? new Date(customer.expiry_date).toISOString().slice(0, 10) : ''
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { showSuccessNotification, showErrorNotification } = useNotification();
    const [batches, setBatches] = useState<VisitCreditBatchAdmin[]>([]);
    const [batchLoading, setBatchLoading] = useState(true);
    const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
    const [batchDate, setBatchDate] = useState('');
    const [batchReason, setBatchReason] = useState('');

    useEffect(() => {
        let cancelled = false;
        setBatchLoading(true);
        api.getVisitCreditBatchesAdmin(customer.user_id).then(result => {
            if (!cancelled) {
                setBatches(result.data || []);
                if (result.error) setError(typeof result.error === 'string' ? result.error : result.error.message);
                setBatchLoading(false);
            }
        }).catch(err => {
            if (!cancelled) { setError(err instanceof Error ? err.message : 'Unable to load Visit Credit batches'); setBatchLoading(false); }
        });
        return () => { cancelled = true; };
    }, [customer.user_id]);

    const startBatchEdit = (batch: VisitCreditBatchAdmin) => {
        setEditingBatchId(batch.transaction_id);
        setBatchDate(new Date(batch.expires_at).toISOString().slice(0, 16));
        setBatchReason('');
    };

    const saveBatchExpiry = async (batch: VisitCreditBatchAdmin) => {
        if (!batchDate) return;
        const nextExpiry = new Date(batchDate);
        if (Number.isNaN(nextExpiry.getTime())) { setError('Enter a valid expiry date and time.'); return; }
        if (nextExpiry.getTime() <= Date.now() && !window.confirm('This date will expire the remaining Visit Credits immediately. Continue?')) return;
        setLoading(true);
        const result = await api.updateVisitCreditExpiryAdmin(batch.transaction_id, nextExpiry.toISOString(), batchReason);
        if (result.error) {
            const message = typeof result.error === 'string' ? result.error : result.error.message;
            setError(message); showErrorNotification('Expiry Update Failed', message);
        } else {
            const refreshed = await api.getVisitCreditBatchesAdmin(customer.user_id);
            setBatches(refreshed.data || []); setEditingBatchId(null);
            showSuccessNotification('Expiry Updated', 'Visit Credit expiry updated successfully.');
        }
        setLoading(false);
    };

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
                <section className="rounded-md border border-blue-200 bg-blue-50/50 p-4">
                    <h3 className="text-sm font-semibold text-gray-900">Visit Credit Packs</h3>
                    <p className="mt-1 text-xs text-gray-600">Expiry is managed per purchased batch. Credit quantity and usage are never changed here.</p>
                    {batchLoading ? <p className="mt-3 text-sm text-gray-500">Loading credit packs...</p> : batches.length === 0 ? <p className="mt-3 text-sm text-gray-500">No paid Visit Credit packs found.</p> : (
                        <div className="mt-3 space-y-3">
                            {batches.map(batch => <div key={batch.transaction_id} className="rounded border border-gray-200 bg-white p-3 text-xs">
                                <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-gray-900">{batch.plan_name || 'Visit Credit Pack'}</p><p className="text-gray-600">{batch.credits_remaining} / {batch.credits_purchased} credits remaining</p><p className="text-gray-600">Purchased: {new Date(batch.paid_at).toLocaleDateString('en-IN')}</p><p className="text-gray-600">Expires: {new Date(batch.expires_at).toLocaleString('en-IN')}</p></div><span className={`rounded-full px-2 py-1 font-semibold ${batch.status === 'active' ? 'bg-green-100 text-green-700' : batch.status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{batch.status.toUpperCase()}</span></div>
                                {batch.credits_remaining > 0 && (editingBatchId === batch.transaction_id ? <div className="mt-3 space-y-2"><input type="datetime-local" value={batchDate} onChange={e => setBatchDate(e.target.value)} className="block w-full rounded border border-gray-300 px-2 py-1.5" disabled={loading} /><input type="text" value={batchReason} onChange={e => setBatchReason(e.target.value)} placeholder="Reason (recommended)" className="block w-full rounded border border-gray-300 px-2 py-1.5" disabled={loading} /><div className="flex justify-end gap-2"><button type="button" onClick={() => setEditingBatchId(null)} className="rounded border px-2 py-1" disabled={loading}>Cancel</button><button type="button" onClick={() => saveBatchExpiry(batch)} className="rounded bg-[#D9A619] px-2 py-1 font-medium text-white" disabled={loading}>Save Expiry</button></div></div> : <button type="button" onClick={() => startBatchEdit(batch)} className="mt-2 font-medium text-blue-700 hover:underline" disabled={loading}>Edit Expiry</button>)}
                            </div>)}
                        </div>
                    )}
                </section>

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
