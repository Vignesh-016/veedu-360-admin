import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { IconX } from '@tabler/icons-react';
import api from '../lib/supabaseClient';
import { ContactPlan, InsertContactPlanAdminParams, UpdateContactPlanAdminParams } from '../lib/types';
import { useNotification } from './NotificationProvider';
import LoadingSpinner from './LoadingSpinner';

interface ContactPlanEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: ContactPlan | null;
    onSuccess: () => void;
}

interface ContactPlanFormBodyProps {
    plan: ContactPlan | null;
    onClose: () => void;
    onSuccess: () => void;
}

function ContactPlanFormBody({ plan, onClose, onSuccess }: ContactPlanFormBodyProps) {
    const [name, setName] = useState<string>(plan?.name || '');
    const [description, setDescription] = useState<string>(plan?.description || '');
    const [contacts, setContacts] = useState<number>(plan?.contacts || 0);
    const [price, setPrice] = useState<number>(plan?.price || 0);
    const [isActive, setIsActive] = useState<boolean>(plan?.is_active ?? true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { showSuccessNotification, showErrorNotification } = useNotification();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (plan) {
                const updateParams: UpdateContactPlanAdminParams = {
                    p_plan_id: plan.plan_id,
                    p_name: name,
                    p_description: description,
                    p_contacts: contacts,
                    p_price: price,
                    p_is_active: isActive,
                };
                const { error: updateError } = await api.updateContactPlanAdmin(updateParams);
                if (updateError) throw updateError;
                showSuccessNotification('Plan Updated', 'Contact plan updated successfully!');
            } else {
                const insertParams: InsertContactPlanAdminParams = {
                    p_name: name,
                    p_description: description,
                    p_contacts: contacts,
                    p_price: price,
                    p_is_active: isActive,
                };
                const { error: insertError } = await api.insertContactPlanAdmin(insertParams);
                if (insertError) throw insertError;
                showSuccessNotification('Plan Added', 'New contact plan added successfully!');
            }
            onSuccess();
            onClose();
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : typeof err === 'object' ? JSON.stringify(err) : 'Failed to save contact plan.';
            setError(errMsg);
            showErrorNotification('Error saving plan', errMsg);
        } finally {
            setLoading(false);
        }
    };

    const inputClass = 'mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500 text-sm';

    return (
        <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900">{plan ? 'Edit Contact Plan' : 'Add New Contact Plan'}</h2>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
                    <IconX className="h-5 w-5" />
                </button>
            </div>

            {error && (
                <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            <div className="px-6 py-5 space-y-5">
                <div>
                    <label htmlFor="cp-name" className="block text-sm font-medium text-gray-700">Plan Name</label>
                    <input type="text" id="cp-name" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} disabled={loading} placeholder="e.g. Standard Contact Pack" />
                </div>
                <div>
                    <label htmlFor="cp-description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea id="cp-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass} disabled={loading} placeholder="Short description shown to users" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="cp-contacts" className="block text-sm font-medium text-gray-700">Number of Contacts</label>
                        <input type="number" id="cp-contacts" value={contacts} onChange={(e) => setContacts(Math.max(0, Number(e.target.value)))} required min="0" className={inputClass} disabled={loading} />
                    </div>
                    <div>
                        <label htmlFor="cp-price" className="block text-sm font-medium text-gray-700">Price (₹)</label>
                        <input type="number" id="cp-price" value={price} onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))} required min="0" step="1" className={inputClass} disabled={loading} />
                        {price === 0 && <p className="text-xs text-teal-600 mt-1">⚡ Free plan — users can claim once</p>}
                    </div>
                </div>
                <div>
                    <label htmlFor="cp-isActive" className="block text-sm font-medium text-gray-700">Status</label>
                    <select id="cp-isActive" value={isActive ? 'true' : 'false'} onChange={(e) => setIsActive(e.target.value === 'true')} className={inputClass} disabled={loading}>
                        <option value="true">Active</option>
                        <option value="false">Inactive (hidden from users)</option>
                    </select>
                </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end bg-gray-50 gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors" disabled={loading}>Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[#D9A619] border border-transparent rounded-md hover:bg-[#8F6F1B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors" disabled={loading}>
                    {loading ? (<span className="flex items-center gap-1"><LoadingSpinner /><span>Saving...</span></span>) : (plan ? 'Update Plan' : 'Add Plan')}
                </button>
            </div>
        </form>
    );
}

function ContactPlanEditModal({ isOpen, onClose, plan, onSuccess }: ContactPlanEditModalProps) {
    const key = plan?.plan_id || 'new';

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={onClose}>
                <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                </TransitionChild>
                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 sm:p-0">
                        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:scale-95">
                            <DialogPanel className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                                {isOpen && (
                                    <ContactPlanFormBody
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

export default ContactPlanEditModal;
