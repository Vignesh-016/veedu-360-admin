import { Link } from 'react-router-dom';
import {
    IconEdit, IconPhoto, IconTrash, IconLoader, IconCopy, IconEye,
    IconChevronLeft, IconChevronRight, IconUserCircle, IconBriefcase,
    IconUserPlus,
    IconChecks,
    IconPaperclip,
    IconUserMinus,
} from '@tabler/icons-react';
import { AdminPropertySummary, PropertyAdminStatus, AdminRole } from '../../lib/types';
import { copyToClipboard } from '../../lib/utils';
import { useNotification } from '../NotificationProvider';
import {
    getSecondaryButtonClasses,
    getPropertyTypeBadgeClasses,
    getListingTypeBadgeClasses,
    getPropertyAdminStatusBadgeClasses
} from '../../lib/twUtils';
import * as displayUtils from '../../lib/displayUtils';
import LoadingSpinner from '../LoadingSpinner';
import { WorkflowTab } from './WorkflowTabConfig';

interface PropertyListProps {
    properties: AdminPropertySummary[];
    loading: boolean;
    actionLoadingPropertyId: string | null;
    markingVerifiedPropertyId: string | null;
    totalCount: number;
    currentPage: number;
    itemsPerPage: number;
    onEditInfo: (propertyId: string) => void;
    onEditImages: (propertyId: string) => void;
    onDeleteProperty: (propertyId: string) => void;
    onToggleListed: (property: AdminPropertySummary) => void;
    onNextPage: () => void;
    onPrevPage: () => void;
    canManageListings: boolean;
    activeWorkflowTab: WorkflowTab;
    currentUserRoles: AdminRole[];
    currentUserId?: string;
    onSelfAssignOwnerContact: (propertyId: string) => void;
    onMarkOwnerVerified: (propertyId: string) => void;
    onMarkMarketingVerified: (propertyId: string) => void;
    onTriggerAssignToMarketer?: (propertyId: string) => void;
    onUnassignFromMarketer?: (propertyId: string) => void;
    onManageDocuments: (propertyId: string) => void;
}

const PropertyList: React.FC<PropertyListProps> = ({
    properties,
    loading,
    actionLoadingPropertyId,
    markingVerifiedPropertyId,
    totalCount,
    currentPage,
    itemsPerPage,
    onEditInfo,
    onEditImages,
    onDeleteProperty,
    onToggleListed,
    onNextPage,
    onPrevPage,
    canManageListings,
    activeWorkflowTab,
    currentUserRoles,
    currentUserId,
    onSelfAssignOwnerContact,
    onMarkOwnerVerified,
    onMarkMarketingVerified,
    onTriggerAssignToMarketer,
    onUnassignFromMarketer,
    onManageDocuments,
}) => {
    const { showSuccessNotification } = useNotification();

    const isSuperAdmin = currentUserRoles.includes('super-admin');
    const isTelecallingOwnerTeam = currentUserRoles.includes('telecalling-owner-team');
    const isMarketingTeam = currentUserRoles.includes('marketing-team');

    if (loading && properties.length === 0) {
        return <div className="p-8 flex justify-center"><LoadingSpinner /></div>;
    }

    if (!loading && properties.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <p className="text-gray-500 text-base font-medium">No properties found</p>
                <p className="text-gray-400 mt-1 text-xs max-w-md">Try adjusting your search filters or add a new property listing.</p>
            </div>
        );
    }

    const totalPages = totalCount > 0 ? Math.ceil(totalCount / itemsPerPage) : 1;

    return (
        <>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th scope="col" className="px-4 py-4 text-left text-[11px] font-medium text-gray-500 uppercase tracking-widest border-b border-gray-100">Property Information</th>
                            <th scope="col" className="px-4 py-4 text-left text-[11px] font-medium text-gray-500 uppercase tracking-widest border-b border-gray-100">Location</th>
                            <th scope="col" className="px-4 py-4 text-left text-[11px] font-medium text-gray-500 uppercase tracking-widest border-b border-gray-100">Type</th>
                            <th scope="col" className="px-4 py-4 text-left text-[11px] font-medium text-gray-500 uppercase tracking-widest border-b border-gray-100">Listing</th>
                            <th scope="col" className="px-4 py-4 text-left text-[11px] font-medium text-gray-500 uppercase tracking-widest border-b border-gray-100">Pricing</th>
                            <th scope="col" className="px-4 py-4 text-left text-[11px] font-medium text-gray-500 uppercase tracking-widest border-b border-gray-100">Management Plan</th>
                            <th scope="col" className="px-4 py-4 text-left text-[11px] font-medium text-gray-500 uppercase tracking-widest border-b border-gray-100">Contact / Assignment</th>
                            <th scope="col" className="px-4 py-4 text-left text-[11px] font-medium text-gray-500 uppercase tracking-widest border-b border-gray-100">Status</th>
                            <th scope="col" className="px-4 py-4 text-center text-[11px] font-medium text-gray-500 uppercase tracking-widest border-b border-gray-100">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {properties.map((property) => {
                            const commonActionLoading = actionLoadingPropertyId === property.property_id;
                            const isSelfAssignOwnerLoading = commonActionLoading && activeWorkflowTab === 'assignableOwnerContact';
                            const isMarkOwnerVerifiedLoading = markingVerifiedPropertyId === property.property_id && activeWorkflowTab === 'myOwnerContactAssignments';
                            const isMarkMarketingVerifiedLoading = markingVerifiedPropertyId === property.property_id && activeWorkflowTab === 'myMarketingAssignments';

                            const canEditPropertyInfo = isSuperAdmin ||
                                (isTelecallingOwnerTeam && property.owner_contact_assigned_admin_id === currentUserId) ||
                                (isMarketingTeam && property.marketing_assigned_admin_id === currentUserId);

                            return (
                                <tr key={property.property_id} className="hover:bg-gray-50 transition-colors duration-150">
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-12 w-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                                {property.property_images?.[0]?.image_url ? (
                                                    <img src={property.property_images[0].image_url} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                        <IconPhoto size={20} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]" title={property.property_name || 'N/A'}>
                                                    {property.property_name || <span className="italic text-gray-400 font-normal">No Name</span>}
                                                </div>
                                                <div className="text-[11px] text-gray-500 font-mono mt-1 cursor-pointer hover:text-[#D9A619] flex items-center"
                                                    onClick={() => { copyToClipboard(property.property_id); showSuccessNotification("ID Copied", property.property_id); }}>
                                                    {property.property_id.substring(0, 8)}... <IconCopy size={10} className="ml-1" />
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-800 truncate max-w-[150px]" title={`${property.locality}, ${property.city} - ${property.pincode ?? 'N/A'}`}>
                                            {property.locality}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1 flex items-center">
                                            <span className="truncate max-w-[100px]">{property.city}</span>
                                            {property.pincode && <span className="ml-1 px-1 bg-gray-100 rounded text-[10px]">{property.pincode}</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span className={`${getPropertyTypeBadgeClasses(property.property_type)} border-0 !bg-gray-100 !text-gray-700 font-medium uppercase tracking-tighter text-[10px]`}>
                                            {displayUtils.getDisplayValue(displayUtils.propertyTypeMap, property.property_type, property.property_type)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span className={`${getListingTypeBadgeClasses(property.listing_type)} border-0 !px-0 font-medium text-[11px]`}>
                                            {displayUtils.getDisplayValue(displayUtils.listingTypeMap, property.listing_type, property.listing_type)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            ₹{property.price.toLocaleString('en-IN')}
                                        </div>
                                        {property.advance_amount && property.listing_type === 'RENTAL' && property.advance_amount > 0 && (
                                            <div className="text-[10px] text-gray-500 mt-0.5 font-medium">Adv: ₹{property.advance_amount.toLocaleString('en-IN')}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-4">
                                        {property.management_plan_info ? (
                                            <div className="min-w-[150px] rounded-lg border border-indigo-100 bg-indigo-50/60 px-3 py-2">
                                                <p className="text-xs font-semibold text-indigo-900 leading-snug">{property.management_plan_info.name}</p>
                                                <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-indigo-600">{property.management_plan_info.percentage}% service plan</p>
                                            </div>
                                        ) : <span className="text-xs italic text-gray-400">No plan selected</span>}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="space-y-2">
                                            {/* Submitter Info */}
                                            {property.submitter_info && (
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-medium text-blue-600">S</div>
                                                    <Link to={`/customers/${property.submitter_info.user_id}`} className="text-xs font-medium text-blue-600 hover:underline truncate max-w-[120px]">
                                                        {property.submitter_info.name || 'Owner'}
                                                    </Link>
                                                </div>
                                            )}
                                            {/* Assignments */}
                                            <div className="flex items-center space-x-2 pt-1 border-t border-gray-50 mt-1">
                                                <div className="flex -space-x-1.5 overflow-hidden">
                                                    <div className={`h-5 w-5 rounded-full ring-2 ring-white flex items-center justify-center ${property.owner_contact_assigned_admin_id ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`} title={`Owner Contact: ${property.owner_contact_assigned_admin_name || 'Unassigned'}`}>
                                                        <IconUserCircle size={12} />
                                                    </div>
                                                    <div className={`h-5 w-5 rounded-full ring-2 ring-white flex items-center justify-center ${property.marketing_assigned_admin_id ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-400'}`} title={`Marketing: ${property.marketing_assigned_admin_name || 'Unassigned'}`}>
                                                        <IconBriefcase size={12} />
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-medium text-gray-400">
                                                    {property.owner_contact_assigned_admin_id && property.marketing_assigned_admin_id ? 'Fully Assigned' : property.owner_contact_assigned_admin_id || property.marketing_assigned_admin_id ? 'Partial' : 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="flex flex-col space-y-2">
                                            <span className={`${getPropertyAdminStatusBadgeClasses(property.admin_status)} !rounded-lg px-2 py-1 font-medium text-[10px]`}>
                                                {displayUtils.getDisplayValue(displayUtils.propertyAdminStatusMap, property.admin_status as PropertyAdminStatus)}
                                            </span>
                                            <div className="flex items-center space-x-1">
                                                <button
                                                    onClick={() => onToggleListed(property)}
                                                    disabled={commonActionLoading || !canManageListings}
                                                    className={`h-2.5 w-2.5 rounded-full ${property.is_listed ? 'bg-green-500 animate-pulse' : 'bg-red-400'} disabled:opacity-50`}
                                                    title={property.is_listed ? 'Publicly Listed' : 'Unlisted'}
                                                />
                                                <span className="text-[10px] font-medium text-gray-500 uppercase tracking-tighter">
                                                    {property.is_listed ? 'Listed' : 'Paused'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end space-x-1.5">
                                            <Link to={`/properties/${property.property_id}`} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all" title="View Property Details"><IconEye size={18} /></Link>
                                            {canEditPropertyInfo && (
                                                <button onClick={() => onEditInfo(property.property_id)} className="p-2 text-gray-500 hover:text-[#D9A619] hover:bg-yellow-50 rounded-full transition-all" title="Edit Property Info" disabled={commonActionLoading}><IconEdit size={18} /></button>
                                            )}
                                            <button onClick={() => onEditImages(property.property_id)} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all" title="Manage Images" disabled={commonActionLoading}><IconPhoto size={18} /></button>
                                            <button onClick={() => onManageDocuments(property.property_id)} className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all" title="Manage Documents" disabled={commonActionLoading}><IconPaperclip size={18} /></button>

                                            <div className="h-6 w-px bg-gray-100 mx-1" />

                                            {activeWorkflowTab === 'assignableOwnerContact' && (isTelecallingOwnerTeam || isSuperAdmin) && property.admin_status === 'SUBMITTED' && !property.owner_contact_assigned_admin_id && (
                                                <button onClick={() => onSelfAssignOwnerContact(property.property_id)} className="px-3 py-1 bg-[#D9A619] text-white text-[10px] font-medium rounded-lg shadow-sm hover:shadow-md transition-all flex items-center" disabled={isSelfAssignOwnerLoading}>
                                                    {isSelfAssignOwnerLoading ? <IconLoader className="animate-spin h-3.5 w-3.5" /> : <><IconUserPlus size={14} className="mr-1" /> ASSIGN</>}
                                                </button>
                                            )}
                                            {activeWorkflowTab === 'myOwnerContactAssignments' && (isTelecallingOwnerTeam || isSuperAdmin) && property.owner_contact_assigned_admin_id === currentUserId && property.admin_status === 'OWNER_CONTACT_PENDING' && (
                                                <button onClick={() => onMarkOwnerVerified(property.property_id)} className="px-3 py-1 bg-green-600 text-white text-[10px] font-medium rounded-lg shadow-sm hover:shadow-md transition-all flex items-center" disabled={isMarkOwnerVerifiedLoading}>
                                                    {isMarkOwnerVerifiedLoading ? <IconLoader className="animate-spin h-3.5 w-3.5" /> : <><IconChecks size={14} className="mr-1" /> VERIFY</>}
                                                </button>
                                            )}
                                            {activeWorkflowTab === 'myMarketingAssignments' && (isMarketingTeam || isSuperAdmin) && property.marketing_assigned_admin_id === currentUserId && property.admin_status === 'MARKETING_VISIT_PENDING' && (
                                                <button onClick={() => onMarkMarketingVerified(property.property_id)} className="px-3 py-1 bg-teal-600 text-white text-[10px] font-medium rounded-lg shadow-sm hover:shadow-md transition-all flex items-center" disabled={isMarkMarketingVerifiedLoading}>
                                                    {isMarkMarketingVerifiedLoading ? <IconLoader className="animate-spin h-3.5 w-3.5" /> : <><IconChecks size={14} className="mr-1" /> VERIFY</>}
                                                </button>
                                            )}
                                            {isSuperAdmin && activeWorkflowTab === 'assignableMarketing' && !property.marketing_assigned_admin_id && onTriggerAssignToMarketer && (
                                                <button onClick={() => onTriggerAssignToMarketer(property.property_id)} className="px-3 py-1 bg-orange-500 text-white text-[10px] font-medium rounded-lg shadow-sm hover:shadow-md transition-all flex items-center" disabled={commonActionLoading}>
                                                    <IconUserPlus size={14} className="mr-1" /> ASSIGN
                                                </button>
                                            )}
                                            {isSuperAdmin && (activeWorkflowTab === 'myMarketingAssignments' || activeWorkflowTab === 'all') && property.marketing_assigned_admin_id && onUnassignFromMarketer && (
                                                <button onClick={() => onUnassignFromMarketer(property.property_id)} className="p-2 text-orange-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-all" disabled={commonActionLoading} title="Unassign Marketer"> <IconUserMinus size={18} /></button>)}
                                            {isSuperAdmin && (
                                                <button onClick={() => onDeleteProperty(property.property_id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all" title="Delete Property" disabled={commonActionLoading}><IconTrash size={18} /></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {totalCount > itemsPerPage && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-3 py-2 sm:px-4 rounded-b-xl">
                    <div><p className="text-xs text-gray-700">Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span></p></div>
                    <div className="flex gap-1">
                        <button onClick={onPrevPage} disabled={currentPage === 1 || loading} className={`${getSecondaryButtonClasses()} !px-2 !py-1 text-xs`}><IconChevronLeft size={14} className="mr-0.5" /> Prev</button>
                        <button onClick={onNextPage} disabled={currentPage === totalPages || loading} className={`${getSecondaryButtonClasses()} !px-2 !py-1 text-xs`}>Next <IconChevronRight size={14} className="ml-0.5" /></button>
                    </div>
                </div>
            )}
        </>
    );
};

export default PropertyList;
