import { Link } from 'react-router-dom';
import {
    IconCopy, IconEye, IconLoader, IconUserPlus, IconTicket,
    IconBuildingStore, IconUser, IconBuilding, IconTag
} from '@tabler/icons-react';
import { TicketAdminSummary } from '../../lib/types';
import { copyToClipboard, formatTimestamp } from '../../lib/utils';
import { getStatusBadgeClasses, getPriorityBadgeClasses, getGenericBadgeClasses } from '../../lib/twUtils';
import * as displayUtils from '../../lib/displayUtils';
import LoadingSpinner from '../LoadingSpinner';

interface TicketListProps {
    tickets: TicketAdminSummary[];
    loading: boolean;
    actionLoadingTicketId: number | null;
    detailsLoadingTicketId: number | null;
    onViewEditTicket: (ticketId: number) => void;
    onSelfAssignTicket?: (ticketId: number) => void;
    showSelfAssignButton?: boolean;
}

const TicketList: React.FC<TicketListProps> = ({
    tickets,
    loading,
    actionLoadingTicketId,
    detailsLoadingTicketId,
    onViewEditTicket,
    onSelfAssignTicket,
    showSelfAssignButton
}) => {
    if (loading && tickets.length === 0) {
        return (
            <div className="p-20 flex flex-col items-center justify-center space-y-4">
                <LoadingSpinner size={40} />
                <p className="text-slate-400 font-medium animate-pulse">Retrieving system tickets...</p>
            </div>
        );
    }

    if (!loading && tickets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="bg-slate-50 p-6 rounded-full mb-4">
                    <IconTicket size={48} className="text-slate-200" />
                </div>
                <h3 className="text-slate-900 font-bold text-lg">No tickets found</h3>
                <p className="text-slate-500 mt-2 text-sm max-w-sm mx-auto leading-relaxed">
                    Try adjusting your search filters or check other workflow tabs.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 border-separate border-spacing-0">
                <thead className="bg-[#f8fafc]">
                    <tr>
                        <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] border-b border-slate-100">Reference & Subject</th>
                        <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] border-b border-slate-100">Incident Property</th>
                        <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] border-b border-slate-100">Customer Identity</th>
                        <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] border-b border-slate-100">Assignment</th>
                        <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] border-b border-slate-100">Priority & Status</th>
                        <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] border-b border-slate-100">Classification</th>
                        <th scope="col" className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] border-b border-slate-100">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                    {tickets.map((ticket) => (
                        <tr key={ticket.ticket_id} className="group hover:bg-slate-50/80 transition-all duration-200">
                            <td className="px-6 py-5 whitespace-nowrap">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-md w-fit mb-1.5 tracking-wider uppercase">
                                        TKT-{ticket.ticket_id}
                                    </span>
                                    <p className="text-sm font-bold text-slate-900 truncate max-w-[200px]" title={ticket.subject}>
                                        {ticket.subject}
                                    </p>
                                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1 flex items-center">
                                        Raised {formatTimestamp(ticket.created_at, { day: 'numeric', month: 'short' })}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-5">
                                <Link to={`/properties/${ticket.property_id}`} className="group/link block">
                                    <div className="flex items-center text-sm font-bold text-blue-600 group-hover/link:text-blue-800 transition-colors">
                                        <IconBuilding size={16} className="mr-1.5 opacity-60" />
                                        <span className="truncate max-w-[180px]">{ticket.property_locality}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium truncate max-w-[180px] mt-0.5 opacity-80" title={ticket.property_address}>
                                        {ticket.property_address}
                                    </p>
                                    <div className="mt-1.5 flex items-center space-x-2">
                                        <span className="text-[10px] font-mono bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded border border-slate-100">
                                            {ticket.property_id.substring(0, 8)}
                                        </span>
                                        <button onClick={(e) => { e.preventDefault(); copyToClipboard(ticket.property_id); }} className="p-1 text-slate-300 hover:text-slate-600 transition-colors">
                                            <IconCopy size={12} />
                                        </button>
                                    </div>
                                </Link>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 mr-3 border border-slate-200 group-hover:bg-slate-200 transition-colors">
                                        <IconUser size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">
                                            {ticket.raiser_name || <span className="italic text-slate-400 font-normal">N/A</span>}
                                        </p>
                                        <p className="text-xs text-slate-500 font-normal opacity-80">{ticket.raiser_email || '-'}</p>
                                        <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-0.5">{ticket.raiser_phone || '-'}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                                {ticket.assigned_vendor_name ? (
                                    <div className="flex items-center space-x-2 text-indigo-600 bg-indigo-50/50 px-3 py-1.5 rounded-xl border border-indigo-100/50 w-fit">
                                        <IconBuildingStore size={14} className="opacity-80" />
                                        <span className="text-xs font-bold truncate max-w-[120px] uppercase tracking-tight">{ticket.assigned_vendor_name}</span>
                                    </div>
                                ) : ticket.assigned_support_admin_name ? (
                                    <div className="flex items-center space-x-2 text-blue-600 bg-blue-50/50 px-3 py-1.5 rounded-xl border border-blue-100/50 w-fit">
                                        <IconUser size={14} className="opacity-80" />
                                        <span className="text-xs font-bold truncate max-w-[120px] uppercase tracking-tight">{ticket.assigned_support_admin_name}</span>
                                    </div>
                                ) : (
                                    <span className="text-[10px] font-bold text-slate-300 uppercase italic tracking-widest pl-2">Unassigned</span>
                                )}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                                <div className="flex flex-col space-y-2">
                                    <span className={`${getPriorityBadgeClasses(ticket.priority)} inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-[0.05em] shadow-sm`}>
                                        <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${ticket.priority === 'HIGH' ? 'bg-red-500 animate-pulse' : ticket.priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-slate-400'}`}></div>
                                        {displayUtils.getDisplayValue(displayUtils.ticketPriorityMap, ticket.priority)}
                                    </span>
                                    <span className={`${getStatusBadgeClasses(ticket.status)} inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-[0.05em] shadow-sm`}>
                                        <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${['NEW', 'OPEN', 'IN_PROGRESS'].includes(ticket.status) ? 'bg-current animate-pulse' :
                                                ['RESOLVED'].includes(ticket.status) ? 'bg-emerald-500' :
                                                    'bg-slate-400'
                                            }`}></div>
                                        {displayUtils.getDisplayValue(displayUtils.ticketStatusMap, ticket.status)}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                                <span className={`${getGenericBadgeClasses()} inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-50 border border-slate-100 text-slate-600 shadow-sm uppercase tracking-widest`}>
                                    <IconTag size={12} className="mr-1.5 opacity-60" />
                                    {ticket.category ? displayUtils.getDisplayValue(displayUtils.ticketCategoryMap, ticket.category) : 'N/A'}
                                </span>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-right">
                                <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 transition-transform">
                                    <button
                                        onClick={() => onViewEditTicket(ticket.ticket_id)}
                                        className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100"
                                        title="View / Edit Ticket"
                                        disabled={detailsLoadingTicketId === ticket.ticket_id}
                                    >
                                        {detailsLoadingTicketId === ticket.ticket_id ? <IconLoader size={18} className="animate-spin" /> : <IconEye size={18} />}
                                    </button>
                                    {showSelfAssignButton && onSelfAssignTicket && !ticket.assigned_support_admin_id && !ticket.assigned_to_vendor_id && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && ticket.status !== 'CANCELLED' && (
                                        <button
                                            onClick={() => onSelfAssignTicket(ticket.ticket_id)}
                                            className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-transparent hover:border-emerald-100"
                                            title="Assign to Self"
                                            disabled={actionLoadingTicketId === ticket.ticket_id}
                                        >
                                            {actionLoadingTicketId === ticket.ticket_id ? <LoadingSpinner size={16} /> : <IconUserPlus size={18} />}
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TicketList;