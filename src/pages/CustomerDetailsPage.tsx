import { useEffect, useState, useCallback, Fragment, JSX } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    IconArrowLeft, IconUserCircle, IconMail, IconPhone, IconId, IconCalendarEvent, IconCreditCard,
    IconListDetails, IconHome, IconBuildingStore, IconMessageCircle, IconReceipt2,
    IconTicket, IconClock, IconCopy, IconEye, IconReceipt, IconPaperclip, IconEdit
} from '@tabler/icons-react';
import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react';

import LoadingSpinner from '../components/LoadingSpinner';
import api from '../lib/supabaseClient';
import { useNotification } from '../components/NotificationProvider';
import { formatDate, formatTimestamp, copyToClipboard } from '../lib/utils';
import {
    getSecondaryButtonClasses, getBaseCardClasses, getStatusBadgeClasses,
    getPropertyTypeBadgeClasses, getListingTypeBadgeClasses, getPriorityBadgeClasses,
    getBooleanBadgeClasses, getGenericBadgeClasses, getPrimaryButtonClasses
} from '../lib/twUtils';
import * as displayUtils from '../lib/displayUtils';
import {
    CustomerFullDetailsAdmin, DenormalizedOwnedPropertySummary, DenormalizedTenantInPropertySummary,
    PropertyAdminStatus, CustomerDocument, DenormalizedCustomerTransaction, DenormalizedCustomerInteraction,
    DenormalizedLandlordRentRecord, DenormalizedTenantRentRecord, DenormalizedCustomerTicketSummary,
    PropertyDocument, UpdateCustomerProfileDetailsAdminParams, DenormalizedUnlockedContact
} from '../lib/types';
import DocumentManager from '../components/DocumentManager';
import CustomerEditModal from '../components/CustomerEditModal';
import JsonEditorModal from '../components/JsonEditorModal';
import { Json } from '../database.types';
import { ReportUserDetails } from '../lib/reports/propertyType';


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
    idLabel?: string,
    idLength?: number
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
        else if (typeof value === 'number') displayValue = value.toLocaleString('en-IN');

        if ((typeof displayValue === 'string' || typeof displayValue === 'number') && unit) {
            displayValue = `${displayValue}${unit}`;
        }
    }

    return (
        <div className="mb-3 break-inside-avoid">
            <dt className="text-xs font-medium text-gray-500 flex items-center mb-0.5">
                {icon && <span className="mr-1.5 text-gray-400">{icon}</span>}
                {label}
            </dt>
            <dd className="text-sm text-gray-800 break-words" title={titleAttr}>
                {displayValue}
                {copyId && renderCopyableId(copyId, idLabel, idLength)}
            </dd>
        </div>
    );
};

const renderUserLink = (user: { id?: string; user_id?: string; name?: string | null } | null | undefined, defaultText: string = "N/A", linkToCustomerPage: boolean = true) => {
    const userIdToUse = user?.id || user?.user_id;
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

const customerDocumentTypes = ['Aadhaar Card', 'PAN Card', 'Driving License', 'Passport', 'Rental Agreement', 'Bank Statement', 'ID Card', 'Other'];

function CustomerDetailsPage() {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const { showSuccessNotification, showErrorNotification } = useNotification();

    const [customerData, setCustomerData] = useState<CustomerFullDetailsAdmin | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal States
    const [isVisitsEditModalOpen, setIsVisitsEditModalOpen] = useState(false);
    const [isProfileJsonEditorOpen, setIsProfileJsonEditorOpen] = useState(false);

    const fetchCustomerDetails = useCallback(async () => {
        if (!userId) {
            setError("No customer ID provided.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await api.getCustomerFullDetails(userId);
            if (fetchError) throw fetchError;
            if (!data) throw new Error("Customer not found.");
            setCustomerData(data);
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to fetch customer details';
            setError(errMsg);
            showErrorNotification("Error Loading Customer", errMsg);
            setCustomerData(null);
        } finally {
            setLoading(false);
        }
    }, [userId, showErrorNotification]);

    useEffect(() => {
        fetchCustomerDetails();
    }, [fetchCustomerDetails]);

    // Modal Close Handlers
    const handleVisitsEditModalClose = () => setIsVisitsEditModalOpen(false);
    const handleProfileJsonEditorClose = () => setIsProfileJsonEditorOpen(false);

    // Save handler for Profile Details JSON editor
    const handleProfileJsonEditorSave = async (updatedJson: Json) => {
        if (!customerData) return;
        setError(null); // Clear previous local errors

        const params: UpdateCustomerProfileDetailsAdminParams = {
            p_customer_user_id: customerData.user_id,
            p_profile_details: updatedJson
            // p_full_name and p_phone could be extracted from updatedJson if desired, or handled separately
        };

        try {
            const { error: updateError } = await api.updateCustomerProfileDetails(params);
            if (updateError) {
                throw new Error(typeof updateError === 'string' ? updateError : updateError.message);
            }
            showSuccessNotification("Profile Updated", "Customer profile details updated successfully!");
            handleProfileJsonEditorClose();
            fetchCustomerDetails(); // Refetch data to update the page
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to update profile details';
            // setError(errMsg); // Set local error if needed, or rely on notification
            showErrorNotification("Update Error", errMsg);
        }
    };


    const handleDocumentUploadSuccess = (newDocument: CustomerDocument | PropertyDocument) => {
        setCustomerData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                customer_documents: [...(prev.customer_documents || []), newDocument as CustomerDocument]
            };
        });
    };

    const handleDocumentDeleteSuccess = (deletedDocumentId: string) => {
        setCustomerData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                customer_documents: (prev.customer_documents || []).filter(doc => doc.document_id !== deletedDocumentId)
            };
        });
    };

    const renderPropertyCard = (prop: DenormalizedOwnedPropertySummary | DenormalizedTenantInPropertySummary, type: 'owned' | 'tenant') => {
        const isOwnedProperty = (p: any): p is DenormalizedOwnedPropertySummary => type === 'owned' && 'property_type' in p;
        const isTenantProperty = (p: any): p is DenormalizedTenantInPropertySummary => type === 'tenant' && 'owner_details' in p;

        return (
            <div key={prop.property_id} className={`${getBaseCardClasses()} p-3 hover:shadow-lg transition-shadow duration-200`}>
                <div className="flex justify-between items-start mb-1">
                    <Link to={`/properties/${prop.property_id}`} className="text-sm font-semibold text-gray-800 hover:text-blue-600 truncate" title={prop.address ?? 'Address N/A'}>
                        {renderTruncatedText(prop.address, 40)}
                    </Link>
                    {renderCopyableId(prop.property_id, "Prop ID")}
                </div>
                <div className="flex items-center space-x-2 mb-2">
                    {isOwnedProperty(prop) && prop.property_type && (
                        <span className={getPropertyTypeBadgeClasses(prop.property_type)}>{displayUtils.getDisplayValue(displayUtils.propertyTypeMap, prop.property_type)}</span>
                    )}
                    {isOwnedProperty(prop) && prop.listing_type && (
                        <span className={getListingTypeBadgeClasses(prop.listing_type)}>{displayUtils.getDisplayValue(displayUtils.listingTypeMap, prop.listing_type)}</span>
                    )}
                    {isOwnedProperty(prop) && prop.admin_status && (
                        <span className={getStatusBadgeClasses(prop.admin_status as PropertyAdminStatus)}>{displayUtils.getDisplayValue(displayUtils.propertyAdminStatusMap, prop.admin_status as PropertyAdminStatus)}</span>
                    )}
                </div>
                <div className="text-xs text-gray-600 space-y-0.5">
                    {isOwnedProperty(prop) && prop.price !== undefined && <p>Price: ₹{prop.price.toLocaleString('en-IN')}</p>}
                    <p>Locality: {prop.locality ?? 'N/A'}, {prop.city ?? 'N/A'}</p>
                    {isOwnedProperty(prop) && prop.tenant_info && (
                        <>
                            <p>Tenant: {prop.tenant_info.name ?? 'N/A'} {renderCopyableId(prop.tenant_info.user_id, 'Tenant ID')}</p>
                            {prop.tenant_info.phone && <p>Phone: +{prop.tenant_info.phone}</p>}
                        </>
                    )}
                    {isTenantProperty(prop) && prop.owner_details && (
                        <p>Owner: {prop.owner_details.name ?? 'N/A'} {renderCopyableId(prop.owner_details.user_id, 'Owner ID')}</p>
                    )}
                    {isOwnedProperty(prop) && (
                        <p>Listed: <span className={getBooleanBadgeClasses(prop.is_listed)}>{prop.is_listed ? 'Yes' : 'No'}</span></p>
                    )}
                </div>
            </div>
        );
    };


    const renderInteractionCard = (interaction: DenormalizedCustomerInteraction) => (
        <div key={interaction.interaction_id} className={`${getBaseCardClasses()} p-3 hover:shadow-lg transition-shadow duration-200`}>
            <div className="flex justify-between items-start mb-1">
                <Link to={`/properties/${interaction.property_id}`} className="text-sm font-semibold text-gray-800 hover:text-blue-600 truncate" title={interaction.property_address ?? undefined}>
                    {renderTruncatedText(interaction.property_address, 40)}
                </Link>
                <span className={getStatusBadgeClasses(interaction.status)}>{displayUtils.getDisplayValue(displayUtils.interactionStatusMap, interaction.status)}</span>
            </div>
            <div className="text-xs text-gray-600 space-y-0.5">
                {interaction.assigned_sales_admin_name && <p>Sales Agent: {interaction.assigned_sales_admin_name}</p>}
                {interaction.assigned_tenant_telecaller_name && <p>Telecaller: {interaction.assigned_tenant_telecaller_name}</p>}
                {interaction.scheduled_for && <p>Scheduled: {formatDate(interaction.scheduled_for)}</p>}
                {interaction.visited_at && <p>Visited: {formatTimestamp(interaction.visited_at)}</p>}
                {interaction.admin_notes && <p>Notes: {renderTruncatedText(interaction.admin_notes, 80)}</p>}
                <p>Created: {formatTimestamp(interaction.created_at)} {renderCopyableId(interaction.interaction_id, "Int ID")}</p>
            </div>
        </div>
    );

    const renderTransactionCard = (tx: DenormalizedCustomerTransaction) => (
        <div key={tx.transaction_id} className={`${getBaseCardClasses()} p-3 hover:shadow-lg transition-shadow duration-200`}>
            <div className="flex justify-between items-start mb-1">
                <span className="text-sm font-semibold text-gray-800">{tx.plan_name ?? 'Plan N/A'}</span>
                <span className={getStatusBadgeClasses(tx.status)}>{tx.status}</span>
            </div>
            <div className="text-xs text-gray-600 space-y-0.5">
                <p>Amount: ₹{tx.amount.toLocaleString('en-IN')}</p>
                <p>Date: {formatTimestamp(tx.created_at)}</p>
                {renderCopyableId(tx.transaction_id, "Tx ID")}
            </div>
        </div>
    );

    const renderRentRecordCard = (
        record: DenormalizedLandlordRentRecord | DenormalizedTenantRentRecord,
        type: 'landlord' | 'tenant'
    ) => {
        const isLandlordRecord = (rec: any): rec is DenormalizedLandlordRentRecord => type === 'landlord' && 'tenant_name' in rec;
        const isTenantRecord = (rec: any): rec is DenormalizedTenantRentRecord => type === 'tenant' && 'landlord_name' in rec;

        return (
            <div key={record.rent_record_id} className={`${getBaseCardClasses()} p-3 hover:shadow-lg transition-shadow duration-200`}>
                <div className="flex justify-between items-start mb-1">
                    <Link to={`/properties/${record.property_id}`} className="text-sm font-semibold text-gray-800 hover:text-blue-600 truncate" title={record.property_address ?? undefined}>
                        {renderTruncatedText(record.property_address, 40)}
                    </Link>
                    <span className={getStatusBadgeClasses(record.status)}>{displayUtils.getDisplayValue(displayUtils.rentStatusMap, record.status)}</span>
                </div>
                <div className="text-xs text-gray-600 space-y-0.5">
                    {isLandlordRecord(record) && record.tenant_email && (
                        <p>Tenant: {record.tenant_name} ({record.tenant_email} | {record.tenant_phone})</p>
                    )}
                    {isTenantRecord(record) && record.landlord_email && (
                        <p>Landlord: {record.landlord_name} ({record.landlord_email} | {record.landlord_phone})</p>
                    )}
                    <p>Period: {formatDate(record.period_start_date)} - {formatDate(record.period_end_date)}</p>
                    <p>Due: {formatDate(record.due_date)} | Amount: ₹{record.amount_due.toLocaleString()} (Paid: ₹{(record.amount_paid ?? 0).toLocaleString()})</p>
                    {renderCopyableId(record.rent_record_id, "Record ID")}
                </div>
            </div>
        );
    };


    const renderUnlockedContactCard = (contact: DenormalizedUnlockedContact) => (
        <div key={contact.property_id} className={`${getBaseCardClasses()} p-3 hover:shadow-lg transition-shadow duration-200`}>
            <div className="flex justify-between items-start mb-1">
                <Link to={`/properties/${contact.property_id}`} className="text-sm font-semibold text-gray-800 hover:text-blue-600 truncate" title={contact.address}>
                    {renderTruncatedText(contact.address, 40)}
                </Link>
                {renderCopyableId(contact.property_id, "Prop ID")}
            </div>
            <div className="text-xs text-gray-600 space-y-0.5 mt-2">
                <p>Owner Name: <span className="font-medium text-gray-800">{contact.owner_name || 'N/A'}</span></p>
                <p>Owner Phone: <span className="font-medium text-gray-800">{contact.owner_phone ? `+${contact.owner_phone}` : 'N/A'}</span></p>
                <p>Unlocked: {formatTimestamp(contact.unlocked_at)}</p>
            </div>
        </div>
    );

    const renderTicketCard = (ticket: DenormalizedCustomerTicketSummary) => (
        <div key={ticket.ticket_id} className={`${getBaseCardClasses()} p-3 hover:shadow-lg transition-shadow duration-200`}>
            <div className="flex justify-between items-start mb-1">
                <span className="text-sm font-semibold text-gray-800 truncate" title={ticket.subject}>#{ticket.ticket_id} - {ticket.subject}</span>
                <span className={getStatusBadgeClasses(ticket.status)}>{displayUtils.getDisplayValue(displayUtils.ticketStatusMap, ticket.status)}</span>
            </div>
            <div className="flex items-center space-x-2 mb-2 text-xs">
                {ticket.priority && <span className={getPriorityBadgeClasses(ticket.priority)}>{displayUtils.getDisplayValue(displayUtils.ticketPriorityMap, ticket.priority)}</span>}
                {ticket.category && <span className={getGenericBadgeClasses()}>{displayUtils.getDisplayValue(displayUtils.ticketCategoryMap, ticket.category)}</span>}
            </div>
            <div className="text-xs text-gray-600 space-y-0.5">
                <p>Property Address: {renderTruncatedText(ticket.property_address, 40)}</p>
                <p>Created: {formatTimestamp(ticket.created_at)}</p>
            </div>
        </div>
    );


    const renderSection = (title: string, icon: React.ReactNode, data: any[] | undefined, cardRenderer: (item: any, type?: any) => JSX.Element, type?: any) => {
        if (!data) return null;
        return (
            <Disclosure as="div" className={`${getBaseCardClasses()} overflow-hidden`} defaultOpen>
                {({ open }) => (
                    <>
                        <DisclosureButton className="flex justify-between w-full px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-gray-500 focus-visible:ring-opacity-75 transition-colors">
                            <span className="flex items-center font-semibold">{icon}<span className='ml-2'>{title} ({data.length})</span></span>
                            <IconEye className={`${open ? '' : 'transform rotate-180'} w-5 h-5 text-gray-400 transition-transform`} />
                        </DisclosureButton>
                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                        >
                            <DisclosurePanel className="text-sm text-gray-500 border-t border-gray-100">
                                {data.length > 0 ? (
                                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {data.map(item => cardRenderer(item, type))}
                                    </div>
                                ) : (
                                    <p className="p-4 italic text-gray-400">No {title.toLowerCase()} found for this customer.</p>
                                )}
                            </DisclosurePanel>
                        </Transition>
                    </>
                )}
            </Disclosure>
        );
    }

    if (loading) return <div className="flex items-center justify-center h-screen"><LoadingSpinner size={40} /></div>;
    if (error) return <div className="container mx-auto p-4"><p className="text-red-500">{error}</p></div>;
    if (!customerData) return <div className="container mx-auto p-4"><p>Customer not found.</p></div>;
    const companyName = import.meta.env.VITE_COMPANY_NAME;

    return (
        <>
            <Helmet>
                <title>{`Customer Details | ${customerData.full_name || userId} | ${companyName}`}</title>
            </Helmet>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <button onClick={() => navigate('/customers')} className={getSecondaryButtonClasses()}>
                            <IconArrowLeft size={16} className="mr-1" /> Back to Customers
                        </button>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setIsVisitsEditModalOpen(true)}
                                className={getSecondaryButtonClasses()}
                            >
                                <IconEdit size={16} className="mr-1.5" /> Edit Credits &amp; Expiry
                            </button>
                            <button
                                onClick={() => setIsProfileJsonEditorOpen(true)}
                                className={getPrimaryButtonClasses()}
                            >
                                <IconListDetails size={16} className="mr-1.5" /> Edit Profile Details
                            </button>
                        </div>
                    </div>

                    <div className="mb-6 pb-4 border-b border-gray-200">
                        <h1 className="text-3xl font-bold text-gray-800 mb-1 flex items-center">
                            {customerData.full_name || <span className='italic text-gray-500'>Unnamed Customer</span>}
                            {renderCopyableId(customerData.user_id, "User ID")}
                        </h1>
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                            <span>{customerData.email || 'No Email'}</span>
                            <span>+{customerData.phone || 'No Phone'}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 space-y-6">
                            <div className={`${getBaseCardClasses()} p-5`}>
                                <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Customer Info</h2>
                                <dl className="columns-1 sm:columns-2 lg:columns-1">
                                    {renderDetailItem("Name", customerData.full_name, <IconUserCircle size={14} />)}
                                    {renderDetailItem("Email", customerData.email, <IconMail size={14} />)}
                                    {renderDetailItem("Phone", "+" + customerData.phone, <IconPhone size={14} />)}
                                    {renderDetailItem("User ID", customerData.user_id, <IconId size={14} />)}
                                    {renderDetailItem("Visit Balance", customerData.visit_balance ?? 0, <IconCreditCard size={14} />)}
                                    {renderDetailItem("Contact Balance", customerData.contact_balance ?? 0, <IconPhone size={14} />)}
                                    {renderDetailItem("Plan Expiry", customerData.expiry_date, <IconCalendarEvent size={14} />, undefined, true)}
                                    {renderDetailItem("Auth User Created", customerData.auth_created_at, <IconClock size={14} />, undefined, false, true)}
                                    {renderDetailItem("Profile Updated", customerData.customer_updated_at, <IconClock size={14} />, undefined, false, true)}
                                </dl>
                            </div>

                            {customerData.profile_details && Object.keys(customerData.profile_details).length > 0 && (
                                <div className={`${getBaseCardClasses()} p-5`}>
                                    <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Profile Details</h2>
                                    <dl className="columns-1 sm:columns-2 lg:columns-1">
                                        {Object.entries(customerData.profile_details).map(([key, value]) => (
                                            renderDetailItem(key, String(value) || <span className='italic'>N/A</span>, <IconListDetails size={14} />)
                                        ))}
                                    </dl>
                                </div>
                            )}
                            <DocumentManager
                                ownerId={customerData.user_id}
                                ownerType="customer"
                                documents={customerData.customer_documents || []}
                                onUploadSuccess={handleDocumentUploadSuccess}
                                onDeleteSuccess={handleDocumentDeleteSuccess}
                                allowedRoles={['super-admin', 'telecalling-owner-team', 'telecalling-tenant-team']}
                                documentTypes={customerDocumentTypes}
                                title="Customer Documents"
                                icon={<IconPaperclip size={16} className="text-gray-500" />}
                            />
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            {renderSection("Owned Properties", <IconHome size={16} className="text-green-600" />, customerData.owned_properties, renderPropertyCard, 'owned')}
                            {renderSection("Rented Properties (Tenant)", <IconBuildingStore size={16} className="text-blue-600" />, customerData.tenant_in_properties, renderPropertyCard, 'tenant')}
                            {renderSection("Interactions", <IconMessageCircle size={16} className="text-purple-600" />, customerData.interactions, renderInteractionCard)}
                            {renderSection("Visit Plan Transactions", <IconReceipt2 size={16} className="text-cyan-600" />, customerData.transactions, renderTransactionCard)}
                            {renderSection("Unlocked Owner Contacts", <IconPhone size={16} className="text-teal-600" />, customerData.unlocked_properties, renderUnlockedContactCard)}
                            {renderSection("Rent Records (as Landlord)", <IconReceipt size={16} className="text-red-600" />, customerData.landlord_rent_records, renderRentRecordCard, 'landlord')}
                            {renderSection("Rent Records (as Tenant)", <IconReceipt size={16} className="text-lime-600" />, customerData.tenant_rent_records, renderRentRecordCard, 'tenant')}
                            {renderSection("Raised Tickets", <IconTicket size={16} className="text-yellow-600" />, customerData.raised_tickets, renderTicketCard)}
                        </div>
                    </div>
                </div>
            </div>
            {/* Modals */}
            <CustomerEditModal
                isOpen={isVisitsEditModalOpen}
                onClose={handleVisitsEditModalClose}
                customer={customerData}
                onSuccess={fetchCustomerDetails}
            />
            <JsonEditorModal
                isOpen={isProfileJsonEditorOpen}
                onClose={handleProfileJsonEditorClose}
                initialJson={customerData?.profile_details}
                onSave={handleProfileJsonEditorSave}
                title={`Edit Profile Details (${customerData?.full_name || 'Customer'})`}
                keyPlaceholder="e.g., Marital Status"
                valuePlaceholder=""
                predefinedKeys={["Job", "Gender", "Marital Status", "Religion", "Caste", "Budget", "Location"]}
            />
        </>
    );
}

export default CustomerDetailsPage;