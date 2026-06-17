import { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
    IconCalendar, IconUser, IconBuilding, IconPhone, IconMail,
    IconCheck, IconX, IconRoute, IconMoodSmile, IconMoodSad
} from '@tabler/icons-react';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../lib/supabaseClient';
import { SalesVisitAssignmentView, SalesVisitPropertyInfo } from '../lib/types';
import { useNotification } from '../components/NotificationProvider';
import { useAuth } from '../lib/AuthContext';
import { formatDate } from '../lib/utils';
import { getPrimaryButtonClasses, getSecondaryButtonClasses, getBaseInputClasses, getStatusBadgeClasses, getBaseCardClasses } from '../lib/twUtils';
import * as displayUtils from '../lib/displayUtils';
import MapViewer from '../components/MapViewer';
import VisitFeedbackModal from '../components/VisitFeedbackModal';

function MySalesVisits() {
    const { user: currentUser } = useAuth();
    const [visits, setVisits] = useState<SalesVisitAssignmentView[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<{ type: 'complete' | 'cancel', id: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const { showSuccessNotification, showErrorNotification } = useNotification();

    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [selectedInteractionForFeedback, setSelectedInteractionForFeedback] = useState<{ id: string, customerName?: string | null, propertyName?: string | null } | null>(null);


    const fetchMyVisits = useCallback(async (date: string) => {
        if (!currentUser) return;
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await api.getMySalesVisitsAdmin(date);
            if (fetchError) throw fetchError;
            setVisits(data || []);
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to fetch sales visits';
            setError(errMsg);
            showErrorNotification("Error Fetching Visits", errMsg);
            setVisits([]);
        } finally {
            setLoading(false);
        }
    }, [currentUser, showErrorNotification]);

    useEffect(() => {
        fetchMyVisits(selectedDate);
    }, [selectedDate, fetchMyVisits]);

    const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedDate(event.target.value);
    };

    const handleOpenFeedbackModal = (interactionId: string, customerName?: string | null, propertyAddress?: string | null) => {
        setSelectedInteractionForFeedback({ id: interactionId, customerName, propertyName: propertyAddress });
        setIsFeedbackModalOpen(true);
    };

    const handleFeedbackModalSuccess = () => {
        fetchMyVisits(selectedDate);
    };


    const handleMarkCancelled = async (interactionId: string) => {
        setActionLoading({ type: 'cancel', id: interactionId });
        const reason = prompt("Enter cancellation reason:");
        if (!reason) {
            showErrorNotification("Reason Required", "Cancellation reason is required.");
            setActionLoading(null);
            return;
        }
        try {
            await api.markInteractionVisitCancelledSales({ p_interaction_id: interactionId, p_cancellation_reason: reason });
            showSuccessNotification("Visit Cancelled", "Interaction marked as cancelled.");
            fetchMyVisits(selectedDate);
        } catch (err) {
            showErrorNotification("Update Failed", err instanceof Error ? err.message : "Could not mark as cancelled.");
        } finally {
            setActionLoading(null);
        }
    };

    const companyName = import.meta.env.VITE_COMPANY_NAME;

    return (
        <>
            <Helmet><title>My Sales Visits | {companyName}</title></Helmet>
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    {error && (<div className="mb-6 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-md shadow" role="alert"><p className="font-bold">Error</p><p>{error}</p></div>)}

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div><h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center"><IconRoute size={30} className="mr-3 text-gray-700" />My Sales Visits</h1><p className="mt-1 text-sm text-gray-500">View and manage your scheduled property visits.</p></div>
                        <div className="flex items-center gap-2">
                            <label htmlFor="visitDate" className="text-sm font-medium text-gray-700">Visit Date:</label>
                            <input type="date" id="visitDate" value={selectedDate} onChange={handleDateChange} className={getBaseInputClasses()} />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-10"><LoadingSpinner size={40} /></div>
                    ) : visits.length === 0 ? (
                        <div className={`p-8 text-center ${getBaseCardClasses()}`}>
                            <IconCalendar size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-xl font-semibold text-gray-700">No visits scheduled for {formatDate(selectedDate)}.</p>
                            <p className="text-gray-500 mt-1">Check another date or wait for new assignments.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {visits.map((assignment) => (
                                <div key={assignment.visit_assignment_id} className={`${getBaseCardClasses()} overflow-hidden`}>
                                    <div className="bg-gray-100 p-4 border-b border-gray-200">
                                        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                            <IconUser size={20} className="mr-2 text-gray-600" />
                                            Customer:
                                            <Link to={`/customers/${assignment.customer_user_id}`} className="ml-1 text-blue-600 hover:underline">
                                                {assignment.customer_name || 'N/A'}
                                            </Link>
                                        </h2>
                                        <div className="text-xs text-gray-600 space-x-3 mt-1">
                                            <span><IconMail size={14} className="inline mr-1" />{assignment.customer_email || 'No Email'}</span>
                                            <span><IconPhone size={14} className="inline mr-1" />{assignment.customer_phone || 'No Phone'}</span>
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-6">
                                        {assignment.property_visits.map((propertyVisit: SalesVisitPropertyInfo) => (
                                            <div key={propertyVisit.interaction_id} className={`p-4 rounded-lg border ${propertyVisit.interaction_status === 'VISIT_COMPLETED' ? 'border-green-300 bg-green-50' : propertyVisit.interaction_status === 'VISIT_CANCELLED' ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:shadow-md'}`}>
                                                <div className="flex flex-col md:flex-row justify-between items-start gap-2 mb-3">
                                                    <div>
                                                        <h3 className="text-md font-semibold text-gray-700 flex items-center">
                                                            <IconBuilding size={18} className="mr-2 text-gray-500" />
                                                            <Link to={`/properties/${propertyVisit.property_id}`} className="text-blue-600 hover:underline">
                                                                {propertyVisit.address || 'Address N/A'}
                                                            </Link>
                                                        </h3>
                                                        <p className="text-xs text-gray-500 ml-7">{propertyVisit.locality}, {propertyVisit.pincode}</p>
                                                    </div>
                                                    <span className={getStatusBadgeClasses(propertyVisit.interaction_status)}>
                                                        {displayUtils.getDisplayValue(displayUtils.interactionStatusMap, propertyVisit.interaction_status)}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                    <div className="text-xs text-gray-600 space-y-1">
                                                        <p><span className="font-medium">Scheduled Date:</span> {propertyVisit.scheduled_for_time ? formatDate(propertyVisit.scheduled_for_time) : 'Not Set'}</p>
                                                        <p><span className="font-medium">Type:</span> {displayUtils.getDisplayValue(displayUtils.propertyTypeMap, propertyVisit.property_type)}</p>
                                                        {propertyVisit.owner_name && (
                                                            <div className="mt-1 pt-1 border-t border-gray-200">
                                                                <p className="font-medium">Owner Contact:</p>
                                                                <p>{propertyVisit.owner_name}</p>
                                                                {propertyVisit.owner_phone && <p>{propertyVisit.owner_phone}</p>}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {propertyVisit.latitude && propertyVisit.longitude && !isFeedbackModalOpen && (
                                                        <div className="h-40 rounded overflow-hidden">
                                                            <MapViewer latitude={propertyVisit.latitude} longitude={propertyVisit.longitude} zoom={15} popupText={propertyVisit.address || 'Property Location'} className="h-full w-full" />
                                                        </div>
                                                    )}
                                                </div>
                                                {propertyVisit.interaction_status === 'VISIT_SCHEDULED_WITH_SALES' && (
                                                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
                                                        <button onClick={() => handleOpenFeedbackModal(propertyVisit.interaction_id, assignment.customer_name, propertyVisit.address)} disabled={actionLoading?.id === propertyVisit.interaction_id} className={getPrimaryButtonClasses({ className: "bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5" })}>
                                                            {actionLoading?.type === 'complete' && actionLoading.id === propertyVisit.interaction_id ? <LoadingSpinner size={14} /> : <IconCheck size={14} className="mr-1" />} Mark Completed
                                                        </button>
                                                        <button onClick={() => handleMarkCancelled(propertyVisit.interaction_id)} disabled={actionLoading?.id === propertyVisit.interaction_id} className={getSecondaryButtonClasses({ className: "text-red-600 border-red-300 hover:bg-red-50 text-xs px-3 py-1.5" })}>
                                                            {actionLoading?.type === 'cancel' && actionLoading.id === propertyVisit.interaction_id ? <LoadingSpinner size={14} /> : <IconX size={14} className="mr-1" />} Mark Cancelled
                                                        </button>
                                                    </div>
                                                )}
                                                {propertyVisit.interaction_status === 'VISIT_COMPLETED' && (
                                                    <p className="text-xs text-green-700 flex items-center"><IconMoodSmile size={16} className="mr-1" /> Visit marked as completed.</p>
                                                )}
                                                {propertyVisit.interaction_status === 'VISIT_CANCELLED' && (
                                                    <p className="text-xs text-red-700 flex items-center"><IconMoodSad size={16} className="mr-1" /> Visit marked as cancelled.</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {selectedInteractionForFeedback && (
                <VisitFeedbackModal
                    isOpen={isFeedbackModalOpen}
                    onClose={() => {
                        setIsFeedbackModalOpen(false);
                        setSelectedInteractionForFeedback(null);
                    }}
                    interactionId={selectedInteractionForFeedback.id}
                    customerName={selectedInteractionForFeedback.customerName}
                    propertyName={selectedInteractionForFeedback.propertyName}
                    onSuccess={handleFeedbackModalSuccess}
                />
            )}
        </>
    );
}

export default MySalesVisits;