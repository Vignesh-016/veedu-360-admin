import { useEffect, useState, useCallback, JSX } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    IconArrowLeft, IconUserCircle, IconMessageCircle,
    IconReceipt, IconTicket, IconCopy, IconPaperclip
} from '@tabler/icons-react';

import LoadingSpinner from '../components/LoadingSpinner';
import api from '../lib/supabaseClient';
import { AdminRole, PropertyAdminStatus, PropertyDocument, SetPropertyListingStatusParams } from '../lib/types';
import { useNotification } from '../components/NotificationProvider';
import { formatDate, formatTimestamp, copyToClipboard } from '../lib/utils';
import {
    getSecondaryButtonClasses, getBooleanBadgeClasses,
    getStatusBadgeClasses, getPriorityBadgeClasses, getGenericBadgeClasses
} from '../lib/twUtils';
import * as displayUtils from '../lib/displayUtils';
import {
    FullPropertyDetailsAdminData, ReportPropertyInteractionDetail,
    ReportPropertyRentRecordDetail, ReportPropertyTicketDetail, ReportUserDetails,
    ReportBaseUser
} from '../lib/reports/propertyType';
import DocumentManager from '../components/DocumentManager';
import { useAuth } from '../lib/AuthContext';

import PropertyOverviewCard from '../components/properties/details/PropertyOverviewCard';
import PropertyLocationCard from '../components/properties/details/PropertyLocationCard';
import PropertySpecificsCard from '../components/properties/details/PropertySpecificsCard';
import PropertyAmenitiesCard from '../components/properties/details/PropertyAmenitiesCard';
import PropertyDescriptionNotesCard from '../components/properties/details/PropertyDescriptionNotesCard';
import PropertyInventoryCard from '../components/properties/details/PropertyInventoryCard';
import PropertyMediaCard from '../components/properties/details/PropertyMediaCard';
import PropertyOwnershipManagementCard from '../components/properties/details/PropertyOwnershipManagementCard';
import PropertyTimestampsCard from '../components/properties/details/PropertyTimestampsCard';
import PropertyRelatedDataSection from '../components/properties/details/PropertyRelatedDataSection';

// Helper functions (can be moved to a shared util if widely used, or kept here if specific)
const renderCopyableId = (id: string | null | undefined, label: string = "ID", length: number = 8) => {
    if (!id) return null;
    return (
        <span
            className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 ml-1"
            onClick={(e) => { e.stopPropagation(); copyToClipboard(id); }}
            title={`Copy ${label}: ${id}`}
        >
            ({label}: {id.substring(0, length)}...) <IconCopy size={12} className="inline" />
        </span>
    );
};

const renderClickableCopyIcon = (id: string | null | undefined, label: string = "ID") => {
    if (!id) return null;
    return (
        <IconCopy
            size={12}
            className="inline ml-1 text-gray-400 hover:text-gray-600 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); copyToClipboard(id); }}
            title={`Copy ${label}: ${id}`}
        />
    );
};

const renderTruncatedText = (text: string | null | undefined, maxLength: number = 50, defaultText: string = "N/A") => {
    if (!text) return <span className='italic text-gray-400'>{defaultText}</span>;
    if (text.length <= maxLength) return text;
    return <span title={text}>{text.substring(0, maxLength)}...</span>;
};

const renderDetailItem = (
    label: string,
    value: React.ReactNode | string | number | boolean | null | undefined,
    icon?: React.ReactNode,
    unit?: string,
    isDate = false,
    isTimestamp = false,
    copyId?: string | null,
    noFormat: boolean = false,
) => {
    if (value === null || value === undefined || value === '') return null;
    let displayValue: React.ReactNode = value;
    let titleAttr: string | undefined = undefined;

    if (typeof value !== 'object' || value === null || !('type' in value)) {
        if (isDate && typeof value === 'string') {
            displayValue = formatDate(value);
            titleAttr = value;
        } else if (isTimestamp && typeof value === 'string') {
            displayValue = formatTimestamp(value);
            titleAttr = value;
        } else if (typeof value === 'boolean') displayValue = <span className={getBooleanBadgeClasses(value)}>{value ? 'Yes' : 'No'}</span>;
        else if (typeof value === 'number' && noFormat == false) displayValue = value.toLocaleString('en-IN');
        if ((typeof displayValue === 'string' || typeof displayValue === 'number') && unit) {
            displayValue = `${displayValue}${unit}`;
        }
    }

    return (
        <div className="mb-2">
            <dt className="text-xs font-medium text-gray-500 flex items-center">
                {icon && <span className="mr-1.5">{icon}</span>}
                {label}
            </dt>
            <dd className="text-sm text-gray-800 break-words" title={titleAttr}>
                {displayValue}
                {copyId && <span className='ml-1'>{renderCopyableId(copyId, label)}</span>}
            </dd>
        </div>
    );
};

const renderUserLink = (user: ReportBaseUser | ReportUserDetails | null | undefined, defaultText: string = "N/A", linkToCustomerPage: boolean = true) => {
    const userIdToUse = user?.id;
    if (!user || !userIdToUse) {
        return <span className='italic text-gray-400'>{defaultText}</span>;
    }
    const name = user.name || defaultText;
    const content = linkToCustomerPage ? (
        <Link to={`/customers/${userIdToUse}`} className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
            {name}
        </Link>
    ) : (
        <span>{name}</span>
    );
    return (
        <>
            {content}
            {renderClickableCopyIcon(userIdToUse, "User ID")}
        </>
    );
};

const renderAssignmentInfo = (assignment: { assigned_admin_id: string, assigned_admin_name: string | null, assigned_at: string } | null, title: string, icon?: React.ReactNode) => {
    if (!assignment) return renderDetailItem(title, <span className='italic text-gray-400'>Not Assigned</span>, icon || <IconUserCircle size={14} />);
    return (
        <div className="pt-2 mt-2 border-t border-gray-100 first:border-t-0 first:mt-0 first:pt-0">
            <dt className="text-xs font-medium text-gray-500 flex items-center">
                {icon || <IconUserCircle size={14} className="mr-1.5" />} {title}
            </dt>
            <dd className="text-sm text-gray-800 break-words">{assignment.assigned_admin_name || 'Admin'} {renderClickableCopyIcon(assignment.assigned_admin_id, "Admin ID")}</dd>
            <p className='text-xs text-gray-600 ml-[22px]'>Assigned: {formatTimestamp(assignment.assigned_at)}</p>
        </div>
    );
};


export const renderUserDetailsSection = (user: ReportUserDetails | null, title: string, icon?: React.ReactNode) => {
    if (!user) return renderDetailItem(title, <span className='italic text-gray-400'>N/A</span>, icon || <IconUserCircle size={14} />);

    const isFullUserDetails = (u: any): u is ReportUserDetails => 'visit_balance' in u && 'expiry_date' in u;

    return (
        <div className="pt-2 mt-2 border-t border-gray-100 first:border-t-0 first:mt-0 first:pt-0">
            <div className="mb-1">
                <dt className="text-xs font-medium text-gray-500 flex items-center">
                    {icon || <IconUserCircle size={14} className="mr-1.5 text-gray-400" />} {title}
                </dt>
                <dd className="text-sm text-gray-800 break-words">{renderUserLink(user, user.name || 'N/A')}</dd>
            </div>
            <div className="pl-[calc(14px+0.375rem)]">
                {user.email && <p className='text-xs text-gray-600 mb-0.5'>Email: {user.email}</p>}
                {user.phone && <p className='text-xs text-gray-600 mb-0.5'>Phone: +{user.phone}</p>}
                {isFullUserDetails(user) && user.visit_balance !== null && typeof user.visit_balance === 'number' && (
                    <p className='text-xs text-gray-600 mb-0.5'>Visits Left: {user.visit_balance}</p>
                )}
                {isFullUserDetails(user) && user.expiry_date && (
                    <p className='text-xs text-gray-600 mb-0.5'>Plan Expiry: {formatDate(user.expiry_date)}</p>
                )}
            </div>
        </div>
    );
};

const propertyDocumentTypes = [
    'Sale Deed', 'Parent Document', 'EC (Encumbrance Certificate)', 'Patta/Chitta',
    'Building Plan Approval', 'Tax Receipt (Property)', 'NOC (No Objection Certificate)',
    'Completion Certificate', 'Occupancy Certificate', 'Title Search Report',
    'Power of Attorney', 'Floor Plan', 'Elevation Drawing', 'Property Photos (Misc)', 'Other'
];
const propertyDocumentManagerRoles: AdminRole[] = ['super-admin', 'telecalling-owner-team', 'marketing-team'];


function PropertyDetailsPage() {
    const { propertyId } = useParams<{ propertyId: string }>();
    const navigate = useNavigate();
    const { showErrorNotification, showSuccessNotification } = useNotification();
    const { isSuperAdmin, roles } = useAuth();

    const [propertyData, setPropertyData] = useState<FullPropertyDetailsAdminData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUpdatingListedStatus, setIsUpdatingListedStatus] = useState(false);

    const canToggleListingStatus = () => {
        if (!propertyData) return false;
        if (isSuperAdmin) return true;
        if (roles.includes('marketing-team') &&
            (propertyData.admin_status === 'MARKETING_VERIFIED' || propertyData.admin_status === 'AWAITING_LISTING' || propertyData.is_listed)) {
            return true;
        }
        return false;
    };

    const fetchPropertyDetails = useCallback(async () => {
        if (!propertyId) {
            setError("No property ID provided.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { data: rows, error: fetchError } = await api.getAdminPropertyReport(propertyId);
            if (fetchError) throw fetchError;
            if (!rows || rows.length === 0) throw new Error("Property not found.");
            const data = rows[0];
            const processedData: FullPropertyDetailsAdminData = {
                ...data,
                images: data.images || [],
                property_documents: data.property_documents || [],
                customer_interactions: data.customer_interactions || [],
                rent_records: data.rent_records || [],
                tickets: data.tickets || [],
            };
            setPropertyData(processedData);
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to fetch property details';
            setError(errMsg);
            showErrorNotification("Error Loading Property", errMsg);
            setPropertyData(null);
        } finally {
            setLoading(false);
        }
    }, [propertyId, showErrorNotification]);

    useEffect(() => {
        fetchPropertyDetails();
    }, [fetchPropertyDetails]);

    const handleToggleListedStatusOnDetailsPage = async () => {
        if (!propertyData || !canToggleListingStatus()) return;
        setIsUpdatingListedStatus(true);
        const newListedStatus = !propertyData.is_listed;
        let newAdminStatusUpdate: PropertyAdminStatus | undefined = undefined;

        if (newListedStatus) {
            if (propertyData.admin_status === 'MARKETING_VERIFIED') newAdminStatusUpdate = 'AWAITING_LISTING';
        } else {
            if (['MARKETING_VERIFIED', 'AWAITING_LISTING', 'LISTED'].includes(propertyData.admin_status)) newAdminStatusUpdate = 'SUSPENDED';
        }

        try {
            const params: SetPropertyListingStatusParams = {
                p_property_id: propertyData.property_id,
                p_make_listed: newListedStatus,
            };
            if (newAdminStatusUpdate) params.p_new_admin_status = newAdminStatusUpdate;
            await api.setPropertyListingStatus(params);
            showSuccessNotification(`Property ${newListedStatus ? 'listed' : 'unlisted'} successfully.`);
            fetchPropertyDetails();
        } catch (err) {
            showErrorNotification("Failed to update listing status.", err instanceof Error ? err.message : String(err));
        } finally {
            setIsUpdatingListedStatus(false);
        }
    };

    const handleDocumentUploadSuccess = (newDocument: PropertyDocument) => {
        setPropertyData(prev => prev ? { ...prev, property_documents: [...(prev.property_documents || []), newDocument] } : null);
    };
    const handleDocumentDeleteSuccess = (deletedDocumentId: string) => {
        setPropertyData(prev => prev ? { ...prev, property_documents: (prev.property_documents || []).filter(doc => doc.document_id !== deletedDocumentId) } : null);
    };

    // Item renderers for PropertyRelatedDataSection
    const renderInteractionItem = (interaction: ReportPropertyInteractionDetail): JSX.Element => (
        <li key={interaction.interaction_id} className="py-2 px-3 border border-gray-200 rounded-md bg-gray-50">
            <div className="flex justify-between items-start text-xs">
                <span className="font-medium">{renderUserLink(interaction.user)}</span>
                <span className={getStatusBadgeClasses(interaction.status)}>{displayUtils.getDisplayValue(displayUtils.interactionStatusMap, interaction.status)}</span>
            </div>
            <div className="text-xs text-gray-600 mt-0.5 space-y-0.5">
                {interaction.assigned_sales_admin && <p>Sales Agent: {renderUserLink(interaction.assigned_sales_admin, interaction.assigned_sales_admin.name || 'N/A', false)}</p>}
                {interaction.scheduled_for && <p>Scheduled: {formatDate(interaction.scheduled_for)}</p>}
                {interaction.visited_at && <p>Visited: {formatTimestamp(interaction.visited_at)}</p>}
                {interaction.admin_notes && <p className="mt-1"><span className='font-semibold'>Notes:</span> {renderTruncatedText(interaction.admin_notes, 60)}</p>}
                {renderCopyableId(interaction.interaction_id, "Int. ID")}
            </div>
        </li>
    );

    const renderRentRecordItem = (record: ReportPropertyRentRecordDetail): JSX.Element => (
        <li key={record.rent_record_id} className="py-2 px-3 border border-gray-200 rounded-md bg-gray-50">
            <div className="flex justify-between items-start text-xs">
                <span className="font-medium">Tenant: {renderUserLink(record.tenant)}</span>
                <span className={getStatusBadgeClasses(record.status)}>{displayUtils.getDisplayValue(displayUtils.rentStatusMap, record.status)}</span>
            </div>
            <div className="text-xs text-gray-600 mt-0.5 space-y-0.5">
                <p>Landlord: {renderUserLink(record.landlord)}</p>
                <p>Period: {formatDate(record.period_start_date)} - {formatDate(record.period_end_date)}</p>
                <p>Due: {formatDate(record.due_date)} | Amt: ₹{record.amount_due.toLocaleString()} (Paid: ₹{record.amount_paid.toLocaleString()})</p>
                {record.notes && <p className="mt-1"><span className='font-semibold'>Notes:</span> {renderTruncatedText(record.notes, 60)}</p>}
                <p>Created: {formatTimestamp(record.created_at)} {renderCopyableId(record.rent_record_id, "Rec. ID")}</p>
            </div>
        </li>
    );

    const renderTicketItem = (ticket: ReportPropertyTicketDetail): JSX.Element => (
        <li key={ticket.ticket_id} className="py-2 px-3 border border-gray-200 rounded-md bg-gray-50">
            <div className="flex justify-between items-start text-xs mb-1">
                <span className="font-semibold text-gray-800 truncate mr-2" title={ticket.subject}>#{ticket.ticket_id} - {ticket.subject} {renderCopyableId(ticket.ticket_id.toString(), "Ticket ID")}</span>
                <span className={getStatusBadgeClasses(ticket.status)}>{displayUtils.getDisplayValue(displayUtils.ticketStatusMap, ticket.status)}</span>
            </div>
            <div className="text-xs text-gray-600 mt-0.5 space-y-1">
                <p>Raised By: {renderUserLink(ticket.raised_by)}</p>
                <p>Priority: <span className={getPriorityBadgeClasses(ticket.priority)}>{displayUtils.getDisplayValue(displayUtils.ticketPriorityMap, ticket.priority)}</span> | Category: <span className={getGenericBadgeClasses()}>{displayUtils.getDisplayValue(displayUtils.ticketCategoryMap, ticket.category)}</span></p>
                {ticket.assigned_support_admin && <p>Support Admin: {renderUserLink(ticket.assigned_support_admin, ticket.assigned_support_admin.name || 'N/A', false)}</p>}
                {ticket.assigned_vendor && <p>Vendor: {ticket.assigned_vendor.company_name ?? 'N/A'} {renderCopyableId(ticket.assigned_vendor.vendor_id, 'Vendor ID')}</p>}
            </div>
        </li>
    );


    if (loading) return <div className="flex items-center justify-center h-screen"><LoadingSpinner size={40} /></div>;
    if (error) return <div className="container mx-auto p-4"><div className="mb-4"><button onClick={() => navigate('/properties')} className={getSecondaryButtonClasses()}><IconArrowLeft size={16} className="mr-1" /> Back</button></div><p className="text-red-500">{error}</p></div>;
    if (!propertyData) return <div className="container mx-auto p-4"><div className="mb-4"><button onClick={() => navigate('/properties')} className={getSecondaryButtonClasses()}><IconArrowLeft size={16} className="mr-1" /> Back</button></div><p>Property not found.</p></div>;

    const companyName = import.meta.env.VITE_COMPANY_NAME;

    return (
        <>
            <Helmet><title>Property Details | {propertyData.address || propertyId} | {companyName}</title></Helmet>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="mb-6 pb-4 border-b border-gray-200">
                        <h1 className="text-3xl font-bold text-gray-800 mb-1">{propertyData.address || 'Property Address N/A'}{propertyData.pincode && `, ${propertyData.pincode}`}</h1>
                        <div className="flex items-center text-sm text-gray-500"><span>{propertyData.locality}, {propertyData.city}</span><span className="mx-2 text-gray-300">|</span>{renderCopyableId(propertyData.property_id, "Property ID")}</div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <PropertyOverviewCard
                                propertyData={propertyData}
                                renderDetailItem={renderDetailItem}
                                canToggleListingStatus={canToggleListingStatus}
                                isUpdatingListedStatus={isUpdatingListedStatus}
                                onToggleListedStatus={handleToggleListedStatusOnDetailsPage}
                            />
                            <PropertyLocationCard propertyData={propertyData} renderDetailItem={renderDetailItem} />
                            <PropertySpecificsCard propertyData={propertyData} renderDetailItem={renderDetailItem} />
                            <PropertyAmenitiesCard propertyData={propertyData} renderDetailItem={renderDetailItem} />
                            <PropertyDescriptionNotesCard propertyData={propertyData} renderDetailItem={renderDetailItem} />
                            <PropertyInventoryCard propertyData={propertyData} renderDetailItem={renderDetailItem} />
                            <PropertyMediaCard images={propertyData.images} youtubeUrl={propertyData.youtube_url} />
                        </div>

                        <div className="lg:col-span-1 space-y-6">
                            <PropertyOwnershipManagementCard
                                propertyData={propertyData}
                                renderUserDetailsSection={renderUserDetailsSection}
                                renderDetailItem={renderDetailItem}
                                renderAssignmentInfo={renderAssignmentInfo}
                                renderTruncatedText={renderTruncatedText}
                            />
                            <DocumentManager
                                ownerId={propertyData.property_id}
                                ownerType="property"
                                documents={propertyData.property_documents}
                                onUploadSuccess={handleDocumentUploadSuccess}
                                onDeleteSuccess={handleDocumentDeleteSuccess}
                                allowedRoles={propertyDocumentManagerRoles}
                                documentTypes={propertyDocumentTypes}
                                title="Property Documents"
                                icon={<IconPaperclip size={16} className="text-gray-500" />}
                            />
                            <PropertyTimestampsCard propertyData={propertyData} renderDetailItem={renderDetailItem} />
                            <PropertyRelatedDataSection
                                title="Interactions"
                                icon={<IconMessageCircle size={16} className='text-purple-500' />}
                                data={propertyData.customer_interactions}
                                itemRenderer={renderInteractionItem}
                            />
                            <PropertyRelatedDataSection
                                title="Rent Records"
                                icon={<IconReceipt size={16} className='text-teal-500' />}
                                data={propertyData.rent_records}
                                itemRenderer={renderRentRecordItem}
                            />
                            <PropertyRelatedDataSection
                                title="Tickets"
                                icon={<IconTicket size={16} className='text-orange-500' />}
                                data={propertyData.tickets}
                                itemRenderer={renderTicketItem}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default PropertyDetailsPage;
