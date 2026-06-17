import {
    IconEdit, IconCopy, IconUserPlus, IconChecks, IconMessage,
    IconHeadset, IconBriefcase, IconLoader, IconEye
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { CustomerInteractionAdminView } from '../../lib/types';
import { copyToClipboard, formatDate, formatTimestamp } from '../../lib/utils';
import { getStatusBadgeClasses } from '../../lib/twUtils';
import * as displayUtils from '../../lib/displayUtils';
import LoadingSpinner from '../LoadingSpinner';

interface InteractionListProps {
    interactions: CustomerInteractionAdminView[];
    loading: boolean;
    actionLoadingInteractionId: string | null;
    onEditInteraction: (interaction: CustomerInteractionAdminView) => void;
    onSelfAssign?: (interactionId: string) => void;
    showSelfAssignButton?: boolean;
    onMarkVerified?: (interactionId: string) => void;
    onUnassignTenantTelecaller?: (interactionId: string) => void;
    showUnassignTTButton?: boolean;
    showMarkVerifiedButton?: boolean;
    currentUserId?: string;
}

const InteractionList: React.FC<InteractionListProps> = ({
    interactions,
    loading,
    actionLoadingInteractionId,
    onEditInteraction,
    onSelfAssign,
    showSelfAssignButton,
    onMarkVerified,
    showMarkVerifiedButton,
    currentUserId,
}) => {
    if (loading && interactions.length === 0) {
        return <div className="p-8 flex justify-center"><LoadingSpinner /></div>;
    }

    if (!loading && interactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <IconMessage size={40} className="text-gray-300 mb-3" />
                <p className="text-gray-500 text-base font-medium">No interactions found</p>
                <p className="text-gray-400 mt-1 text-xs max-w-md">Try adjusting your search filters or check other tabs.</p>
            </div>
        );
    }

    return (
        <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50/50">
                <tr>
                    <th className="px-4 py-4 text-left text-[11px] font-medium text-gray-400 uppercase tracking-widest border-b border-gray-100">Customer</th>
                    <th className="px-4 py-4 text-left text-[11px] font-medium text-gray-400 uppercase tracking-widest border-b border-gray-100">Property</th>
                    <th className="px-4 py-4 text-left text-[11px] font-medium text-gray-400 uppercase tracking-widest border-b border-gray-100">Staff Assignments</th>
                    <th className="px-4 py-4 text-left text-[11px] font-medium text-gray-400 uppercase tracking-widest border-b border-gray-100">Status</th>
                    <th className="px-4 py-4 text-left text-[11px] font-medium text-gray-400 uppercase tracking-widest border-b border-gray-100">Timeline</th>
                    <th className="px-4 py-4 text-left text-[11px] font-medium text-gray-400 uppercase tracking-widest border-b border-gray-100">Admin Notes</th>
                    <th className="px-4 py-4 text-right text-[11px] font-medium text-gray-400 uppercase tracking-widest border-b border-gray-100">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {interactions.map((interaction) => (
                    <tr key={interaction.interaction_id} className="hover:bg-gray-50 transition-colors duration-150 group">
                        <td className="px-4 py-4 whitespace-nowrap">
                            <Link to={`/customers/${interaction.customer_user_id}`} className="block text-sm font-medium text-blue-600 hover:text-blue-800 truncate max-w-[150px]" title={interaction.customer_name || interaction.customer_email || 'Unnamed Customer'}>
                                {interaction.customer_name || interaction.customer_email || 'Unnamed Customer'}
                            </Link>
                            <div className="text-[11px] text-gray-500 mt-0.5 group-hover:text-gray-700 transition-colors">{interaction.customer_phone || 'No phone'}</div>
                            <div className="text-[11px] text-gray-400 font-mono mt-1 cursor-pointer hover:text-blue-500 flex items-center" onClick={() => copyToClipboard(interaction.customer_user_id)} title="Copy User ID">
                                {interaction.customer_user_id.substring(0, 8)}... <IconCopy size={10} className="ml-1" />
                            </div>
                        </td>
                        <td className="px-4 py-4 min-w-[200px]">
                            <Link to={`/properties/${interaction.property_id}`} className="block text-sm font-medium text-gray-800 hover:text-blue-600 line-clamp-1" title={`${interaction.property_locality}, ${interaction.property_address}`}>
                                {interaction.property_locality}
                            </Link>
                            <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{interaction.property_address}</div>
                            <div className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded mt-1.5 inline-block font-mono">
                                {interaction.property_id.substring(0, 8)}
                            </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                            <div className="space-y-2">
                                <div className={`flex items-center px-2 py-1 rounded-md border ${interaction.assigned_tenant_telecaller_name ? 'bg-purple-50/50 border-purple-100 text-purple-700' : 'bg-gray-50 border-gray-100 text-gray-400'} max-w-[140px]`} title={interaction.assigned_tenant_telecaller_name ? `TT: ${interaction.assigned_tenant_telecaller_name}` : 'Telecaller Unassigned'}>
                                    <IconHeadset size={14} className="mr-1.5 flex-shrink-0" />
                                    <span className="text-[11px] font-medium truncate">
                                        {interaction.assigned_tenant_telecaller_name || 'No Telecaller'}
                                    </span>
                                </div>
                                <div className={`flex items-center px-2 py-1 rounded-md border ${interaction.assigned_sales_admin_name ? 'bg-teal-50/50 border-teal-100 text-teal-700' : 'bg-gray-50 border-gray-100 text-gray-400'} max-w-[140px]`} title={interaction.assigned_sales_admin_name ? `Sales: ${interaction.assigned_sales_admin_name}` : 'Sales Unassigned'}>
                                    <IconBriefcase size={14} className="mr-1.5 flex-shrink-0" />
                                    <span className="text-[11px] font-medium truncate">
                                        {interaction.assigned_sales_admin_name || 'No Sales'}
                                    </span>
                                </div>
                            </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`${getStatusBadgeClasses(interaction.interaction_status)} text-[10px] px-2.5 py-1 rounded-full font-medium uppercase tracking-wide`}>
                                {displayUtils.getDisplayValue(displayUtils.interactionStatusMap, interaction.interaction_status)}
                            </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                            <div className="space-y-1.5">
                                {interaction.scheduled_for ? (
                                    <div className="flex items-center text-[11px] text-gray-700 font-normal">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></div>
                                        <span className="font-medium mr-1">Sched:</span>
                                        <span>{formatDate(interaction.scheduled_for, { day: 'numeric', month: 'short' })}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center text-[11px] text-gray-400 italic">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-200 mr-2"></div>
                                        Not Scheduled
                                    </div>
                                )}
                                {interaction.visited_at ? (
                                    <div className="flex items-center text-[11px] text-emerald-700 font-normal">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></div>
                                        <span className="font-medium mr-1">Visit:</span>
                                        <span>{formatTimestamp(interaction.visited_at, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center text-[11px] text-gray-400 italic">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-200 mr-2"></div>
                                        No Visit
                                    </div>
                                )}
                            </div>
                        </td>
                        <td className="px-4 py-4 max-w-[180px]">
                            <p className="text-[11px] text-gray-600 italic line-clamp-2" title={interaction.admin_notes ?? undefined}>
                                {interaction.admin_notes || 'No admin notes recorded yet.'}
                            </p>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                                <button
                                    onClick={() => onEditInteraction(interaction)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-colors border border-gray-100"
                                    title="Edit Interaction"
                                >
                                    <IconEdit size={16} />
                                </button>
                                {showSelfAssignButton && onSelfAssign && interaction.interaction_status === 'VISIT_PENDING' && !interaction.assigned_tenant_telecaller_id && (
                                    <button
                                        onClick={() => onSelfAssign(interaction.interaction_id)}
                                        disabled={actionLoadingInteractionId === interaction.interaction_id}
                                        className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-gray-100"
                                        title="Assign to Self"
                                    >
                                        {actionLoadingInteractionId === interaction.interaction_id ? <IconLoader size={16} className="animate-spin" /> : <IconUserPlus size={16} />}
                                    </button>
                                )}
                                {showMarkVerifiedButton && onMarkVerified &&
                                    interaction.assigned_tenant_telecaller_id === currentUserId &&
                                    interaction.interaction_status === 'VISIT_PENDING' &&
                                    (
                                        <button
                                            onClick={() => onMarkVerified(interaction.interaction_id)}
                                            disabled={actionLoadingInteractionId === interaction.interaction_id}
                                            className="p-1.5 rounded-lg text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors border border-gray-100"
                                            title="Mark Tenant Verified"
                                        >
                                            {actionLoadingInteractionId === interaction.interaction_id ? <IconLoader size={16} className="animate-spin" /> : <IconChecks size={16} />}
                                        </button>
                                    )
                                }
                                <Link
                                    to={`/properties/${interaction.property_id}`}
                                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors border border-gray-100"
                                    title="View Property"
                                >
                                    <IconEye size={16} />
                                </Link>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default InteractionList;