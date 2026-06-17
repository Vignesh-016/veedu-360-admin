import {
    IconUserShield, IconBuildingStore, IconCertificate, IconUserCircle, IconUsers
} from '@tabler/icons-react';
import * as displayUtils from '../../../lib/displayUtils';
import { getBaseCardClasses, getSubmitterTypeBadgeClasses } from '../../../lib/twUtils';
import { JSX } from 'react';
import { FullPropertyDetailsAdminData, ReportUserDetails } from '../../../lib/reports/propertyType';

interface PropertyOwnershipManagementCardProps {
    propertyData: FullPropertyDetailsAdminData;
    renderUserDetailsSection: (user: ReportUserDetails | null, title: string, icon?: React.ReactNode) => JSX.Element | null;
    renderDetailItem: (
        label: string,
        value: React.ReactNode | string | number | boolean | null | undefined,
        icon?: React.ReactNode,
        unit?: string,
        isDate?: boolean,
        isTimestamp?: boolean,
        copyId?: string | null
    ) => JSX.Element | null;
    renderAssignmentInfo: (
        assignment: { assigned_admin_id: string, assigned_admin_name: string | null, assigned_at: string } | null,
        title: string,
        icon?: React.ReactNode
    ) => JSX.Element | null;
    renderTruncatedText: (text: string | null | undefined, maxLength?: number, defaultText?: string) => React.ReactNode;
}

const PropertyOwnershipManagementCard: React.FC<PropertyOwnershipManagementCardProps> = ({
    propertyData,
    renderUserDetailsSection,
    renderDetailItem,
    renderAssignmentInfo,
    renderTruncatedText
}) => {
    return (
        <div className={getBaseCardClasses()}>
            <div className="p-4 border-b border-gray-200"><h3 className="text-base font-semibold text-gray-800">Ownership & Management</h3></div>
            <div className="p-4 space-y-3">
                {renderUserDetailsSection(propertyData.submitter, "Submitter", <IconUserShield size={16} />)}
                {renderDetailItem("Submitter Type", propertyData.submitter_type ? <span className={getSubmitterTypeBadgeClasses(propertyData.submitter_type)}>{displayUtils.getDisplayValue(displayUtils.submitterTypeMap, propertyData.submitter_type)}</span> : 'N/A', <IconUserShield size={14} />)}
                {/* {renderDetailItem("Can Reach Out (Submitter)", propertyData.can_reachout, <IconMessageQuestion size={14} />)} */}
                {/* the above field is commented out because this is always going to be true */}

                {renderUserDetailsSection(propertyData.tenant, "Tenant", <IconBuildingStore size={16} />)}

                {propertyData.management_plan && (
                    <div className="pt-2 mt-2 border-t border-gray-100">
                        {renderDetailItem("Management Plan", propertyData.management_plan.name || <span className='italic text-gray-400'>N/A</span>, <IconCertificate size={14} />, undefined, false, false, propertyData.management_plan.plan_id)}
                        {propertyData.management_plan.percentage !== undefined && <p className='text-xs text-gray-600 ml-[22px]'>{propertyData.management_plan.percentage}%</p>}
                        {propertyData.management_plan.description && <p className='text-xs text-gray-600 ml-[22px] mt-1 italic' title={propertyData.management_plan.description}>Desc: {renderTruncatedText(propertyData.management_plan.description, 50)}</p>}
                    </div>
                )}
                {renderAssignmentInfo(propertyData.owner_contact_assignment, "Owner Contact Assignment", <IconUserCircle size={14} />)}
                {renderAssignmentInfo(propertyData.marketing_assignment, "Marketing Assignment", <IconUsers size={14} />)}
            </div>
        </div>
    );
};

export default PropertyOwnershipManagementCard;