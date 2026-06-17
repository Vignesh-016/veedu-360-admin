import { Link } from 'react-router-dom';
import { IconEye, IconCopy, IconUserPlus, IconUser, IconHome2, IconCalendarEvent, IconClock } from '@tabler/icons-react';
import { RentalApplicationAdminView } from '../../lib/types';
import { copyToClipboard, formatDate, formatTimestamp } from '../../lib/utils';
import { getStatusBadgeClasses } from '../../lib/twUtils';
import * as displayUtils from '../../lib/displayUtils';
import LoadingSpinner from '../LoadingSpinner';

interface RentalApplicationListProps {
    applications: RentalApplicationAdminView[];
    loading: boolean;
    actionLoadingAppId: string | null;
    onViewDetails: (applicationId: string) => void;
    onSelfAssign?: (applicationId: string) => void;
    showSelfAssignButton?: boolean;
}

const RentalApplicationList: React.FC<RentalApplicationListProps> = ({
    applications,
    loading,
    actionLoadingAppId,
    onViewDetails,
    onSelfAssign,
    showSelfAssignButton,
}) => {
    if (loading && applications.length === 0) {
        return <div className="p-8 flex justify-center"><LoadingSpinner /></div>;
    }

    if (!loading && applications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <p className="text-gray-500 text-base font-medium">No rental applications found</p>
                <p className="text-gray-400 mt-1 text-xs max-w-md">Try adjusting your search filters or check other tabs.</p>
            </div>
        );
    }

    return (
        <table className="min-w-full divide-y divide-gray-100">
            <thead>
                <tr className="bg-slate-50/80">
                    <th className="px-4 py-4 text-left text-[11px] font-medium text-slate-500 uppercase tracking-widest">App ID</th>
                    <th className="px-4 py-4 text-left text-[11px] font-medium text-slate-500 uppercase tracking-widest whitespace-nowrap"><IconHome2 size={14} className="inline mr-1 opacity-60" /> Property</th>
                    <th className="px-4 py-4 text-left text-[11px] font-medium text-slate-500 uppercase tracking-widest"><IconUser size={14} className="inline mr-1 opacity-60" /> Applicant</th>
                    <th className="px-4 py-4 text-left text-[11px] font-medium text-slate-500 uppercase tracking-widest">Landlord</th>
                    <th className="px-4 py-4 text-left text-[11px] font-medium text-slate-500 uppercase tracking-widest whitespace-nowrap"><IconClock size={14} className="inline mr-1 opacity-60" /> Timeline</th>
                    <th className="px-4 py-4 text-left text-[11px] font-medium text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-4 py-4 text-left text-[11px] font-medium text-slate-500 uppercase tracking-widest"><IconUser size={14} className="inline mr-1 opacity-60" /> Assigned</th>
                    <th className="px-4 py-4 text-right text-[11px] font-medium text-slate-500 uppercase tracking-widest">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {applications.map((app) => (
                    <tr key={app.application_id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-4 py-4 whitespace-nowrap">
                            <span
                                className="font-mono text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded cursor-pointer hover:bg-slate-200 transition-colors flex items-center w-fit"
                                onClick={() => copyToClipboard(app.application_id)}
                                title={`Click to copy App ID: ${app.application_id}`}
                            >
                                {app.application_id.substring(0, 8)}
                                <IconCopy className="ml-1 h-3 w-3 opacity-50" />
                            </span>
                        </td>
                        <td className="px-4 py-4">
                            <Link to={`/properties/${app.property_id}`} className="block font-medium text-slate-900 hover:text-blue-600 transition-colors truncate max-w-[200px]" title={`${app.property_address}, ${app.property_locality}, ${app.property_city}`}>
                                {app.property_address || 'N/A'}
                            </Link>
                            <div className="text-slate-500 text-[11px] font-medium tracking-tight truncate max-w-[200px] mt-0.5 opacity-80">{app.property_locality}, {app.property_city}</div>
                        </td>
                        <td className="px-4 py-4">
                            <Link to={`/customers/${app.applicant_user_id}`} className="block font-medium text-slate-900 hover:text-blue-600 transition-colors truncate max-w-[150px]" title={app.applicant_name || app.applicant_email || 'Applicant'}>
                                {app.applicant_name || 'N/A'}
                            </Link>
                            <div className="text-slate-500 text-[11px] font-medium truncate max-w-[150px] mt-0.5 opacity-80">{app.applicant_email}</div>
                        </td>
                        <td className="px-4 py-4">
                            <Link to={`/customers/${app.landlord_user_id}`} className="block font-medium text-slate-600 hover:text-blue-600 transition-colors truncate max-w-[150px]" title={app.landlord_name || 'Landlord'}>
                                {app.landlord_name || 'N/A'}
                            </Link>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-1">
                                <div className="text-[11px] font-medium text-slate-700 flex items-center">
                                    <IconClock size={12} className="mr-1 text-slate-400" /> {formatTimestamp(app.submitted_at)}
                                </div>
                                {app.application_data?.move_in_date && (
                                    <div className="text-[10px] font-medium text-indigo-600 flex items-center bg-indigo-50 px-1.5 py-0.5 rounded w-fit">
                                        <IconCalendarEvent size={12} className="mr-1" /> Move-in: {formatDate(app.application_data.move_in_date as string)}
                                    </div>
                                )}
                            </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`${getStatusBadgeClasses(app.application_status)} text-[10px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-sm`}>
                                {displayUtils.getDisplayValue(displayUtils.rentalApplicationStatusMap, app.application_status)}
                            </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                            {app.assigned_admin_name ? (
                                <div className="flex items-center text-slate-700 font-medium text-[11px]" title={app.assigned_admin_name}>
                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center mr-2 text-slate-500 border border-slate-200">
                                        <IconUser size={14} />
                                    </div>
                                    <span className="truncate max-w-[100px]">{app.assigned_admin_name}</span>
                                </div>
                            ) : (
                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded border border-gray-100 italic">Unassigned</span>
                            )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right font-medium">
                            <div className="flex flex-nowrap items-center justify-end space-x-2">
                                <button
                                    onClick={() => onViewDetails(app.application_id)}
                                    className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200 border border-transparent hover:border-slate-200 shadow-sm hover:shadow"
                                    title="View Details"
                                >
                                    <IconEye size={18} />
                                </button>
                                {showSelfAssignButton && onSelfAssign && !app.assigned_admin_id && app.application_status === 'SUBMITTED' && (
                                    <button
                                        onClick={() => onSelfAssign(app.application_id)}
                                        disabled={actionLoadingAppId === app.application_id}
                                        className="p-2 text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg transition-all duration-200 border border-blue-100 hover:border-blue-600 shadow-sm"
                                        title="Self Assign"
                                    >
                                        {actionLoadingAppId === app.application_id ? <LoadingSpinner size={16} /> : <IconUserPlus size={18} />}
                                    </button>
                                )}
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default RentalApplicationList;