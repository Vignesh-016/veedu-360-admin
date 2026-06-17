import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useState, FormEvent } from 'react';
import { IconX, IconMessageCircle, IconAlertCircle } from '@tabler/icons-react';
import api from '../lib/supabaseClient';
import { useNotification } from './NotificationProvider';
import LoadingSpinner from './LoadingSpinner';
import { getBaseInputClasses, getPrimaryButtonClasses, getSecondaryButtonClasses } from '../lib/twUtils';

interface VisitFeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    interactionId: string;
    customerName?: string | null; // Optional, for display
    propertyName?: string | null; // Optional, for display
    onSuccess: () => void;
}

function VisitFeedbackModal({ isOpen, onClose, interactionId, customerName, propertyName, onSuccess }: VisitFeedbackModalProps) {
    const [feedback, setFeedback] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { showSuccessNotification, showErrorNotification } = useNotification();

    const handleClose = () => {
        setFeedback('');
        setError(null);
        setLoading(false);
        onClose();
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await api.markInteractionVisitCompletedSales({
                p_interaction_id: interactionId,
                p_feedback: feedback || undefined
            });
            showSuccessNotification("Visit Feedback Saved", "Interaction marked as completed with feedback.");
            onSuccess();
            handleClose();
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : "Could not save feedback and complete visit.";
            setError(errMsg);
            showErrorNotification("Update Failed", errMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-20" onClose={loading ? () => { } : handleClose}>
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

                <div className="fixed inset-0 z-20 overflow-y-auto">
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
                                <form onSubmit={handleSubmit}>
                                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                                        <h2 className="text-lg font-medium text-gray-900 flex items-center">
                                            <IconMessageCircle className="mr-2 text-gray-500" />
                                            Visit Feedback
                                        </h2>
                                        <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-500" disabled={loading}>
                                            <IconX className="h-5 w-5" />
                                        </button>
                                    </div>

                                    <div className="px-6 py-5 space-y-4">
                                        {error && (
                                            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                                <p className="text-sm text-red-700 flex items-center">
                                                    <IconAlertCircle className="w-4 h-4 mr-2 text-red-500" />
                                                    {error}
                                                </p>
                                            </div>
                                        )}
                                        {customerName && propertyName && (
                                            <p className="text-sm text-gray-600">
                                                Customer: <span className="font-medium">{customerName}</span> <br />
                                                Property: <span className="font-medium">{propertyName}</span>
                                            </p>
                                        )}
                                        <div>
                                            <label htmlFor="feedback" className="block text-sm font-medium text-gray-700">
                                                Feedback (Optional)
                                            </label>
                                            <textarea
                                                id="feedback"
                                                value={feedback}
                                                onChange={(e) => setFeedback(e.target.value)}
                                                rows={4}
                                                className={`mt-1 ${getBaseInputClasses()}`}
                                                placeholder="Enter any feedback about the visit..."
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>

                                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end bg-gray-50 space-x-3">
                                        <button type="button" onClick={handleClose} className={getSecondaryButtonClasses()} disabled={loading}>
                                            Cancel
                                        </button>
                                        <button type="submit" className={getPrimaryButtonClasses()} disabled={loading}>
                                            {loading ? <LoadingSpinner size={16} /> : 'Save Feedback & Complete Visit'}
                                        </button>
                                    </div>
                                </form>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

export default VisitFeedbackModal;