import { Link } from 'react-router-dom';
import { IconCopy, IconEye, IconEdit, IconTrash, IconLoader, IconBuilding } from '@tabler/icons-react';
import { RentRecordAdminSummary } from '../../lib/types';
import { copyToClipboard, formatDate } from '../../lib/utils';
import { getSecondaryButtonClasses, getStatusBadgeClasses } from '../../lib/twUtils';
import * as displayUtils from '../../lib/displayUtils';
import LoadingSpinner from '../LoadingSpinner';

interface RentRecordListProps {
    records: RentRecordAdminSummary[];
    loading: boolean;
    deletingRecordId: string | null;
    onEditRecord: (record: RentRecordAdminSummary) => void;
    onViewDetails: (record: RentRecordAdminSummary) => void;
    onDeleteRecord: (recordId: string) => void;
}

const RentRecordList: React.FC<RentRecordListProps> = ({
    records,
    loading,
    deletingRecordId,
    onEditRecord,
    onViewDetails,
    onDeleteRecord,
}) => {
    if (loading && records.length === 0) {
        return <div className="p-8 flex justify-center"><LoadingSpinner /></div>;
    }

    if (!loading && records.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <p className="text-gray-500 text-base font-medium">No rent records found</p>
                <p className="text-gray-400 mt-1 text-xs max-w-md">Try adjusting your search filters or add a new rent record.</p>
            </div>
        );
    }

    return (
        <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Record Info</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Property</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Tenant / Landlord</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Period</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Amount (Due/Paid)</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {records.map((record) => (
                    <tr key={record.rent_record_id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-3 py-2 whitespace-nowrap">
                            <span className="font-medium text-gray-600 hover:text-gray-800 cursor-pointer" onClick={() => copyToClipboard(record.rent_record_id)} title="Click to copy Record ID">{record.rent_record_id.substring(0, 8)}... <IconCopy className="inline-block ml-0.5 h-2.5 w-2.5" /></span>
                            <div className="text-gray-500 text-[11px]">Due: {formatDate(record.due_date)}</div>
                        </td>
                        <td className="px-3 py-2">
                            <Link to={`/properties/${record.property_id}`} className="block font-medium text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[150px]" title={`${record.property_address}, ${record.property_locality}`}>
                                <IconBuilding size={13} className="inline mr-1 text-gray-400" /> {record.property_address || 'N/A'}
                            </Link>
                            <div className="text-gray-500 text-[11px] truncate max-w-[150px]">{record.property_locality}</div>
                        </td>
                        <td className="px-3 py-2">
                            <div>
                                <span className="font-medium text-gray-400">T:</span>
                                <Link to={`/customers/${record.tenant_user_id}`} className="ml-1 text-blue-600 hover:underline truncate max-w-[100px]" title={record.tenant_name || record.tenant_email || 'Tenant'}>
                                    {record.tenant_name || 'N/A'}
                                </Link>
                                <span className="text-gray-500 text-[11px] ml-1">({record.tenant_phone || 'No Phone'})</span>
                            </div>
                            <div className="mt-0.5">
                                <span className="font-medium text-gray-400">L:</span>
                                <Link to={`/customers/${record.landlord_user_id}`} className="ml-1 text-blue-600 hover:underline truncate max-w-[100px]" title={record.landlord_name || record.landlord_email || 'Landlord'}>
                                    {record.landlord_name || 'N/A'}
                                </Link>
                            </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                            {formatDate(record.period_start_date)} - {formatDate(record.period_end_date)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">
                            ₹{record.amount_due.toLocaleString()}
                            <span className="text-gray-500 text-[11px]"> / ₹{record.amount_paid.toLocaleString()}</span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                            <span className={getStatusBadgeClasses(record.status)}>
                                {displayUtils.getDisplayValue(displayUtils.rentStatusMap, record.status)}
                            </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right font-medium">
                            <div className="flex items-center justify-end space-x-1">
                                <button onClick={() => onViewDetails(record)} className={`${getSecondaryButtonClasses()} !p-1`} title="View Details & Payments"><IconEye size={14} /></button>
                                <button onClick={() => onEditRecord(record)} className={`${getSecondaryButtonClasses()} !p-1`} title="Edit Record"><IconEdit size={14} /></button>
                                <button onClick={() => onDeleteRecord(record.rent_record_id)} className={`${getSecondaryButtonClasses({ className: "border-red-300 text-red-600 hover:bg-red-50" })} !p-1`} title="Delete Record" disabled={deletingRecordId === record.rent_record_id}>
                                    {deletingRecordId === record.rent_record_id ? <IconLoader size={14} className="animate-spin" /> : <IconTrash size={14} />}
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default RentRecordList;