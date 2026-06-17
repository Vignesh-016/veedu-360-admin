import { Fragment } from 'react';
import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react';
import {
    IconFilter, IconRefresh, IconSearch, IconChevronDown,
    IconUser, IconBuildingStore, IconUsersGroup, IconListCheck, IconUrgent, IconCategory
} from '@tabler/icons-react';
import { TicketStatus, TicketPriority, TicketCategory } from '../../lib/types';
import * as displayUtils from '../../lib/displayUtils';
import { getBaseInputClasses } from '../../lib/twUtils';
import SearchableSelect from '../SearchableSelect';
import api from '../../lib/supabaseClient';

const statusOptions = Object.entries(displayUtils.ticketStatusMap)
    .map(([value, label]) => ({ value: value as TicketStatus, label }));
const priorityOptions = Object.entries(displayUtils.ticketPriorityMap)
    .map(([value, label]) => ({ value: value as TicketPriority, label }));
const categoryOptions = Object.entries(displayUtils.ticketCategoryMap)
    .map(([value, label]) => ({ value: value as TicketCategory, label }));

interface TicketFiltersProps {
    filters: {
        statusFilter: TicketStatus | undefined;
        priorityFilter: TicketPriority | undefined;
        categoryFilter: TicketCategory | undefined;
        customerFilter: string | undefined;
        vendorFilter: string | undefined;
        assignedAdminFilter: string | undefined;
        searchTermFilter: string;
    };
    setters: {
        setStatusFilter: (value: TicketStatus | undefined) => void;
        setPriorityFilter: (value: TicketPriority | undefined) => void;
        setCategoryFilter: (value: TicketCategory | undefined) => void;
        setCustomerFilter: (value: string | undefined) => void;
        setVendorFilter: (value: string | undefined) => void;
        setAssignedAdminFilter: (value: string | undefined) => void;
        setSearchTermFilter: (value: string) => void;
    };
    onApplyFilters: () => void;
    onClearFilters: () => void;
    isDisclosureOpenByDefault?: boolean;
    disableVendorAdminFilters?: boolean; // To disable vendor/admin filters on certain tabs
}

const TicketFilters: React.FC<TicketFiltersProps> = ({
    filters,
    setters,
    onApplyFilters,
    onClearFilters,
    isDisclosureOpenByDefault = false,
    disableVendorAdminFilters = false,
}) => {

    const fetchCustomerOptions = async (query: string) => {
        const { data } = await api.searchCustomers(query, undefined, 0, 20);
        return (data || []).map(c => ({ value: c.user_id, label: `${c.full_name || 'N/A'} (${c.email || 'No Email'})` }));
    };

    const fetchVendorOptions = async (query: string) => {
        const { data } = await api.listVendorsAdmin({ p_search_term: query, p_limit: 20 });
        return (data || []).map(v => ({ value: v.vendor_id, label: v.company_name }));
    };

    const fetchAdminAssigneeOptions = async (query: string): Promise<{ value: string; label: string }[]> => {
        const { data, error: adminError } = await api.listAdmins(undefined, true, query, 0, 20);
        if (adminError) {
            console.error("Error fetching admins for assignment:", adminError);
            return []
        }
        return (data || []).filter(admin =>
            admin.roles.includes('telecalling-owner-team') ||
            admin.roles.includes('telecalling-tenant-team') ||
            admin.roles.includes('super-admin')
        ).map((admin) => ({
            value: admin.user_id,
            label: `${admin.full_name || admin.email}`,
        }));
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden transition-all hover:shadow-md">
            <Disclosure defaultOpen={isDisclosureOpenByDefault} as="div">
                {({ open }) => (
                    <>
                        <DisclosureButton className="flex justify-between w-full px-6 py-4 text-left text-sm font-bold text-slate-700 bg-slate-50/50 hover:bg-slate-100 transition-colors focus:outline-none">
                            <span className="flex items-center uppercase tracking-widest">
                                <IconFilter className="mr-2 text-slate-400" size={18} />
                                Advanced Search
                            </span>
                            <IconChevronDown className={`${open ? 'transform rotate-180' : ''} w-5 h-5 text-slate-400 transition-transform`} />
                        </DisclosureButton>
                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-200" enterFrom="opacity-0 -translate-y-1" enterTo="opacity-100 translate-y-0"
                            leave="transition ease-in duration-150" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 -translate-y-1"
                        >
                            <DisclosurePanel className="px-6 pt-5 pb-7 border-t border-gray-100">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-7">
                                    <div>
                                        <label htmlFor="statusFilter" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center opacity-80">
                                            <IconListCheck size={14} className="mr-1.5" /> Status Selection
                                        </label>
                                        <select id="statusFilter" value={filters.statusFilter || ''} onChange={(e) => setters.setStatusFilter(e.target.value as TicketStatus || undefined)} className={`${getBaseInputClasses()} rounded-xl border-gray-200 h-10`}>
                                            <option value="">All Statuses</option>
                                            {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="priorityFilter" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center opacity-80">
                                            <IconUrgent size={14} className="mr-1.5" /> Severity Rank
                                        </label>
                                        <select id="priorityFilter" value={filters.priorityFilter || ''} onChange={(e) => setters.setPriorityFilter(e.target.value as TicketPriority || undefined)} className={`${getBaseInputClasses()} rounded-xl border-gray-200 h-10`}>
                                            <option value="">All Priorities</option>
                                            {priorityOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="categoryFilter" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center opacity-80">
                                            <IconCategory size={14} className="mr-1.5" /> Type Category
                                        </label>
                                        <select id="categoryFilter" value={filters.categoryFilter || ''} onChange={(e) => setters.setCategoryFilter(e.target.value as TicketCategory || undefined)} className={`${getBaseInputClasses()} rounded-xl border-gray-200 h-10`}>
                                            <option value="">All Categories</option>
                                            {categoryOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                    </div>
                                    <SearchableSelect label="Customer Lookup" value={filters.customerFilter} onChange={(val) => setters.setCustomerFilter(val as string | undefined)} fetchOptions={fetchCustomerOptions} placeholder="Search Customers..." icon={<IconUser size={14} />} />
                                    <SearchableSelect label="Vendor Assigned" value={filters.vendorFilter} onChange={(val) => setters.setVendorFilter(val as string | undefined)} fetchOptions={fetchVendorOptions} placeholder="Search Vendors..." icon={<IconBuildingStore size={14} />} disabled={disableVendorAdminFilters} />
                                    <SearchableSelect label="Agent Responsible" value={filters.assignedAdminFilter} onChange={(val) => setters.setAssignedAdminFilter(val as string | undefined)} fetchOptions={fetchAdminAssigneeOptions} placeholder="Search Admins..." icon={<IconUsersGroup size={14} />} disabled={disableVendorAdminFilters} />
                                    <div className="sm:col-span-2 lg:col-span-1">
                                        <label htmlFor="searchTermFilter" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center opacity-80">
                                            <IconSearch size={14} className="mr-1.5" /> Subject Keywords
                                        </label>
                                        <input type="text" id="searchTermFilter" value={filters.searchTermFilter} onChange={(e) => setters.setSearchTermFilter(e.target.value)} className={`${getBaseInputClasses()} rounded-xl border-gray-200 h-10`} placeholder="Subject, address..." />
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-3 pt-5 border-t border-slate-100">
                                    <button onClick={onApplyFilters} className="bg-slate-900 text-white rounded-xl px-5 py-2 text-sm font-bold shadow-md hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-95 flex items-center">
                                        <IconFilter className="mr-2" size={16} /> Apply Filters
                                    </button>
                                    <button onClick={onClearFilters} className="bg-white text-slate-600 border border-slate-200 rounded-xl px-5 py-2 text-sm font-bold hover:bg-slate-50 transition-all active:scale-95 flex items-center">
                                        <IconRefresh className="mr-2" size={16} /> Reset
                                    </button>
                                </div>
                            </DisclosurePanel>
                        </Transition>
                    </>
                )}
            </Disclosure>
        </div>
    );
};

export default TicketFilters;