import { Link } from 'react-router-dom';
import { IconCopy } from '@tabler/icons-react';
import { RentRecordAdminSummary } from '../../lib/types';
import { copyToClipboard, formatTimestamp } from '../../lib/utils';
import LoadingSpinner from '../LoadingSpinner';

interface PaymentListProps {
    payments: RentRecordAdminSummary[];
    loading: boolean;
}

const PaymentList: React.FC<PaymentListProps> = ({
    payments,
    loading,
}) => {
    if (loading && payments.length === 0) {
        return <div className="p-8 flex justify-center"><LoadingSpinner /></div>;
    }

    if (!loading && payments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <p className="text-gray-500 text-base font-medium">No payment records found</p>
                <p className="text-gray-400 mt-1 text-xs max-w-md">Try adjusting your search filters.</p>
            </div>
        );
    }

    return (
        <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50">
                <tr>
                    <th scope="col" className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Property ID</th>
                    <th scope="col" className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Rent Record</th>
                    <th scope="col" className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                    <th scope="col" className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Amount Due</th>
                    <th scope="col" className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Payment (Due) Date</th>
                    <th scope="col" className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Record Notes</th>
                    {/* Add Actions if needed */}
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((record) => ( // Renamed 'payment' to 'record' for clarity
                    <tr key={record.rent_record_id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Link to={`/properties/${record.property_id}`} className="font-medium text-blue-600 hover:text-blue-800 hover:underline" title={`View Property: ${record.property_id}`}>
                                {record.property_id.substring(0, 8)}...
                            </Link>
                            <IconCopy
                                className="inline-block ml-1 h-3 w-3 text-gray-400 cursor-pointer hover:text-gray-600"
                                onClick={() => copyToClipboard(record.property_id)}
                                title="Copy Property ID"
                            />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            <Link to={`/rent-records`} onClick={(e) => { e.preventDefault(); alert(`Navigate to Rent Record Details page for ID: ${record.rent_record_id} (UI to be implemented or reuse existing modal)`); }} className="block cursor-pointer hover:text-blue-600 hover:underline" title={`View Rent Record: ${record.rent_record_id}`}>
                                {record.rent_record_id.substring(0, 8)}...
                            </Link>
                            <IconCopy
                                className="inline-block ml-1 h-3 w-3 text-gray-400 cursor-pointer hover:text-gray-600"
                                onClick={() => copyToClipboard(record.rent_record_id)}
                                title="Copy Rent Record ID"
                            />
                            <span className='text-xs text-gray-500 block'>Due: {formatTimestamp(record.due_date, { month: 'short', day: 'numeric' })}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            <Link to={`/customers/${record.tenant_user_id}`} className="block font-medium text-blue-600 hover:text-blue-800 hover:underline" title={`View Customer: ${record.tenant_name}`}>
                                {record.tenant_name || <span className='italic text-gray-400'>N/A</span>}
                            </Link>
                            <span className="block text-xs text-gray-500">{record.tenant_email || '-'}</span>
                            <span className="block text-xs text-gray-500">{record.tenant_phone || '-'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{record.amount_due.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatTimestamp(record.due_date)}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate" title={record.notes ?? ''}>{record.notes || '-'}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default PaymentList;