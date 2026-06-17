import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { IconX } from '@tabler/icons-react';
import api from '../lib/supabaseClient';
import { VisitPlanAdminView, InsertVisitPlanAdminParams, UpdateVisitPlanAdminParams } from '../lib/types';
import { useNotification } from './NotificationProvider';
import LoadingSpinner from './LoadingSpinner';

interface VisitPlanEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: VisitPlanAdminView | null;
    onSuccess: () => void;
}

interface VisitPlanEditFormBodyProps {
    plan: VisitPlanAdminView | null;
    onClose: () => void;
    onSuccess: () => void;
}

function VisitPlanEditFormBody({ plan, onClose, onSuccess }: VisitPlanEditFormBodyProps) {
    const [name, setName] = useState<string>(plan?.name || '');
    const [description, setDescription] = useState<string>(plan?.description || '');
    const [visits, setVisits] = useState<number>(plan?.visits || 0);
    const [price, setPrice] = useState<number>(plan?.price || 0);
    const [isActive, setIsActive] = useState<boolean>(plan?.is_active ?? false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { showSuccessNotification, showErrorNotification } = useNotification();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (plan) {
                const updateParams: UpdateVisitPlanAdminParams = {
                    p_plan_id: plan.plan_id, p_name: name, p_description: description,
                    p_visits: visits, p_price: price, p_is_active: isActive,
                };
                const { error: updateError } = await api.updateVisitPlanAdmin(updateParams);
                if (updateError) throw updateError;
                showSuccessNotification("Plan Updated", "Visit plan updated successfully!");
            } else {
                const insertParams: InsertVisitPlanAdminParams = {
                    p_name: name, p_description: description, p_visits: visits,
                    p_price: price, p_is_active: isActive,
                };
                const { error: insertError } = await api.insertVisitPlanAdmin(insertParams);
                if (insertError) throw insertError;
                showSuccessNotification("Plan Added", "New visit plan added successfully!");
            }
            onSuccess();
            onClose();
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to save visit plan.';
            setError(errMsg);
            showErrorNotification("Error saving plan", errMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900">{plan ? 'Edit Visit Plan' : 'Add New Visit Plan'}</h2>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors duration-200">
                    <IconX className="h-5 w-5" />
                </button>
            </div>
            {error && (
                <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}
            <div className="px-6 py-5 space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Plan Name</label>
                    <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500" disabled={loading} />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500" disabled={loading} />
                </div>
                <div>
                    <label htmlFor="visits" className="block text-sm font-medium text-gray-700">Number of Visits</label>
                    <input type="number" id="visits" value={visits} onChange={(e) => setVisits(Math.max(0, Number(e.target.value)))} required min="0" className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500" disabled={loading} />
                </div>
                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price (₹)</label>
                    <input type="number" id="price" value={price} onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))} required min="0" step="0.01" className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500" disabled={loading} />
                </div>
                <div>
                    <label htmlFor="isActive" className="block text-sm font-medium text-gray-700">Active</label>
                    <select id="isActive" value={isActive ? 'true' : 'false'} onChange={(e) => setIsActive(e.target.value === 'true')} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500" disabled={loading}>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                    </select>
                </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end bg-gray-50">
                <div className="flex items-center space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500" disabled={loading}>Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[#D9A619] border border-transparent rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D9A619] disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading}>
                        {loading ? (<span className="flex items-center"><LoadingSpinner /><span className='ml-1'>Saving...</span></span>) : (plan ? 'Update Plan' : 'Add Plan')}
                    </button>
                </div>
            </div>
        </form>
    );
}

function VisitPlanEditModal({ isOpen, onClose, plan, onSuccess }: VisitPlanEditModalProps) {
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
                                    <VisitPlanEditFormBody
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

export default VisitPlanEditModal;