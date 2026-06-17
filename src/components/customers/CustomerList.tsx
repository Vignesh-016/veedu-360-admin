import { Link } from 'react-router-dom';
import {
    IconEdit, IconCopy, IconListDetails,
    IconLoader, IconEye, IconPhone
} from '@tabler/icons-react';
import { CustomerSearchResultAdmin } from '../../lib/types';
import { copyToClipboard, formatDate } from '../../lib/utils';
import LoadingSpinner from '../LoadingSpinner';

interface CustomerListProps {
    customers: CustomerSearchResultAdmin[];
    loading: boolean;
    detailsLoading: boolean;
    loadingCustomerId: string | null;
    onEditCustomerVisits: (customer: CustomerSearchResultAdmin) => void;
    onEditProfileDetails: (customer: CustomerSearchResultAdmin) => void;
}

const CustomerList: React.FC<CustomerListProps> = ({
    customers,
    loading,
    detailsLoading,
    loadingCustomerId,
    onEditCustomerVisits,
    onEditProfileDetails,
}) => {
    if (loading && customers.length === 0) {
        return <div className="p-8 flex justify-center"><LoadingSpinner /></div>;
    }

    if (!loading && customers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <p className="text-gray-500 text-base font-medium">No customers found</p>
                <p className="text-gray-400 mt-1 text-xs max-w-md">Try adjusting your search term.</p>
            </div>
        );
    }

    return (
        <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50/50">
                <tr>
                    <th scope="col" className="px-4 py-4 text-left text-[11px] font-medium text-gray-500 uppercase tracking-widest border-b border-gray-100">Name / ID</th>
                    <th scope="col" className="px-4 py-4 text-left text-[11px] font-medium text-gray-500 uppercase tracking-widest border-b border-gray-100">Contact</th>
                    <th scope="col" className="px-4 py-4 text-center text-[11px] font-medium text-gray-500 uppercase tracking-widest border-b border-gray-100">Visits</th>
                    <th scope="col" className="px-4 py-4 text-left text-[11px] font-medium text-gray-500 uppercase tracking-widest border-b border-gray-100">Expiry</th>
                    <th scope="col" className="px-4 py-4 text-right text-[11px] font-medium text-gray-500 uppercase tracking-widest border-b border-gray-100">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                    <tr key={customer.user_id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-4 py-4 whitespace-nowrap">
                            <Link to={`/customers/${customer.user_id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[180px] block" title={customer.full_name || customer.email || 'Unnamed Customer'}>
                                {customer.full_name || <span className='italic text-gray-400 font-normal'>No Name</span>}
                            </Link>
                            <div className="text-[11px] text-gray-400 font-mono mt-1 cursor-pointer hover:text-blue-500 flex items-center" onClick={() => copyToClipboard(customer.user_id)} title="Click to copy User ID">
                                {customer.user_id.substring(0, 8)}... <IconCopy size={10} className="ml-1" />
                            </div>
                        </td>
                        <td className="px-4 py-4">
                            <div className='text-sm text-gray-700 truncate max-w-[200px]' title={customer.email || undefined}>{customer.email || 'N/A'}</div>
                            <div className="text-[11px] text-gray-500 mt-1 flex items-center">
                                <IconPhone size={10} className="mr-1 text-gray-400" /> +{customer.phone || 'N/A'}
                            </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                            <span className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-gray-100 text-gray-800 text-xs font-medium">
                                {customer.visit_balance ?? 0}
                            </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-700">
                                {customer.expiry_date ? formatDate(customer.expiry_date) : <span className="text-gray-400">N/A</span>}
                            </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                            <div className='flex items-center space-x-2 justify-end'>
                                <button
                                    onClick={() => onEditProfileDetails(customer)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-colors border border-gray-100"
                                    title="Edit Profile Details"
                                    disabled={detailsLoading && loadingCustomerId === customer.user_id}
                                >
                                    {detailsLoading && loadingCustomerId === customer.user_id ? <IconLoader className="animate-spin h-4 w-4" /> : <IconListDetails size={16} />}
                                </button>
                                <button
                                    onClick={() => onEditCustomerVisits(customer)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-orange-600 transition-colors border border-gray-100"
                                    title="Edit Visits/Expiry"
                                    disabled={detailsLoading && loadingCustomerId === customer.user_id}
                                >
                                    {detailsLoading && loadingCustomerId === customer.user_id ? <IconLoader className="animate-spin h-4 w-4" /> : <IconEdit size={16} />}
                                </button>
                                <Link to={`/customers/${customer.user_id}`} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors border border-gray-100" title="View Full Details">
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

export default CustomerList;