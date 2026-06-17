import { Fragment } from 'react';
import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react';
import {
    IconFilter, IconChevronDown, IconUser, IconBuildingSkyscraper,
    IconUserSearch, IconCalendar, IconSearch,
    IconRefresh
} from '@tabler/icons-react';
import { InteractionStatus } from '../../lib/types';
import * as displayUtils from '../../lib/displayUtils';
import { getBaseInputClasses, getPrimaryButtonClasses, getSecondaryButtonClasses } from '../../lib/twUtils';
import SearchableSelect from '../SearchableSelect';
import api from '../../lib/supabaseClient';

const interactionStatusOptions: { value: InteractionStatus; label: string }[] = Object.entries(displayUtils.interactionStatusMap)
    .map(([value, label]) => ({ value: value as InteractionStatus, label }));


// --- Fetcher functions for SearchableSelect ---
const fetchTenantTelecallerAdminOptions = async (query: string): Promise<{ value: string; label: string }[]> => {
    const { data, error: adminError } = await api.listAdmins('telecalling-tenant-team', true, query, 0, 20);
    if (adminError) {
        console.error("Error fetching tenant telecallers for filter:", adminError);
        return [];
    }
    return (data || []).map((admin) => ({
        value: admin.user_id,
        label: `${admin.full_name || admin.email}`,
    }));
};

const fetchSalesAdminOptions = async (query: string): Promise<{ value: string; label: string }[]> => {
    const { data, error: adminError } = await api.listAdmins('sales-team', true, query, 0, 20);
    if (adminError) {
        console.error("Error fetching sales admins for filter:", adminError);
        return [];
    }
    return (data || []).map((admin) => ({
        value: admin.user_id,
        label: `${admin.full_name || admin.email}`,
    }));
};


interface InteractionFiltersProps {
    filters: {
        propertyIdFilter: string;
        statusFilter: InteractionStatus[];
        userIdFilter: string;
        scheduledForStartFilter: string;
        scheduledForEndFilter: string;
        propertySearchFilter: string;
        customerSearchFilter: string;
        assignedTTFilter: string;
        assignedSalesFilter: string;
    };
    setters: {
        setPropertyIdFilter: (value: string) => void;
        setStatusFilter: (value: InteractionStatus[]) => void;
        setUserIdFilter: (value: string) => void;
        setScheduledForStartFilter: (value: string) => void;
        setScheduledForEndFilter: (value: string) => void;
        setPropertySearchFilter: (value: string) => void;
        setCustomerSearchFilter: (value: string) => void;
        setAssignedTTFilter: (value: string) => void;
        setAssignedSalesFilter: (value: string) => void;
    };
    onApplyFilters: () => void;
    onClearFilters: () => void;
    isSuperAdmin: boolean;
    isDisclosureOpenByDefault?: boolean;
}

const InteractionFilters: React.FC<InteractionFiltersProps> = ({
    filters,
    setters,
    onApplyFilters,
    onClearFilters,
    isSuperAdmin,
    isDisclosureOpenByDefault = false,
}) => {

    const handleStatusCheckboxChange = (statusValue: InteractionStatus) => {
        setters.setStatusFilter(
            filters.statusFilter.includes(statusValue)
                ? filters.statusFilter.filter(s => s !== statusValue)
                : [...filters.statusFilter, statusValue]
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8 transition-all duration-300 hover:shadow-md">
            <Disclosure defaultOpen={isDisclosureOpenByDefault} as="div">
                {({ open }) => (
                    <>
                        <DisclosureButton className="flex justify-between items-center w-full px-6 py-4 text-left focus:outline-none rounded-t-xl transition-all duration-200 bg-white border-b border-gray-50 hover:bg-gray-50/80 group">
                            <span className="flex items-center text-gray-900 font-medium group-focus-within:text-blue-600 transition-colors">
                                <IconFilter className="mr-3 text-gray-400 group-hover:text-blue-500 transition-colors" size={20} />
                                Advanced Filters
                            </span>
                            <div className="flex items-center">
                                <span className="text-xs font-medium text-gray-400 mr-2 group-hover:text-gray-500">{open ? 'Hide' : 'Show'} filters</span>
                                <IconChevronDown className={`${open ? 'transform rotate-180 text-blue-500' : 'text-gray-400'} w-5 h-5 transition-transform duration-200`} />
                            </div>
                        </DisclosureButton>
                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-200" enterFrom="opacity-0 -translate-y-1" enterTo="opacity-100 translate-y-0"
                            leave="transition ease-in duration-150" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 -translate-y-1"
                        >
                            <DisclosurePanel className="px-6 pt-4 pb-6 border-t border-gray-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
                                    {/* Status Filter */}
                                    <div className="col-span-full sm:col-span-1">
                                        <label className="block text-sm font-normal text-gray-700 mb-2">Status</label>
                                        <div className="space-y-2 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-md bg-gray-50">
                                            {interactionStatusOptions.map((option) => (
                                                <div key={option.value} className="flex items-center">
                                                    <input
                                                        id={`status-${option.value}`}
                                                        name="statusFilter"
                                                        type="checkbox"
                                                        value={option.value}
                                                        checked={filters.statusFilter.includes(option.value)}
                                                        onChange={() => handleStatusCheckboxChange(option.value)}
                                                        className="h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                                                    />
                                                    <label htmlFor={`status-${option.value}`} className="ml-2 block text-sm text-gray-700">{option.label}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Scheduled Dates */}
                                    <div>
                                        <label htmlFor="scheduledForStartFilter" className="block text-sm font-normal text-gray-700 mb-1">Scheduled After</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><IconCalendar size={16} className="text-gray-400" /></div>
                                            <input type="date" id="scheduledForStartFilter" value={filters.scheduledForStartFilter} onChange={(e) => setters.setScheduledForStartFilter(e.target.value)} className={`pl-10 ${getBaseInputClasses()}`} />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="scheduledForEndFilter" className="block text-sm font-normal text-gray-700 mb-1">Scheduled Before</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><IconCalendar size={16} className="text-gray-400" /></div>
                                            <input type="date" id="scheduledForEndFilter" value={filters.scheduledForEndFilter} onChange={(e) => setters.setScheduledForEndFilter(e.target.value)} className={`pl-10 ${getBaseInputClasses()}`} />
                                        </div>
                                    </div>

                                    {/* User/Property ID/Search */}
                                    <div>
                                        <label htmlFor="userIdFilter" className="block text-sm font-normal text-gray-700 mb-1">Customer User ID</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><IconUser size={16} className="text-gray-400" /></div>
                                            <input type="text" id="userIdFilter" value={filters.userIdFilter} onChange={(e) => setters.setUserIdFilter(e.target.value)} className={`pl-10 ${getBaseInputClasses()}`} placeholder="e.g., customer UUID" />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="propertyIdFilter" className="block text-sm font-normal text-gray-700 mb-1">Property ID</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><IconBuildingSkyscraper size={16} className="text-gray-400" /></div>
                                            <input type="text" id="propertyIdFilter" value={filters.propertyIdFilter} onChange={(e) => setters.setPropertyIdFilter(e.target.value)} className={`pl-10 ${getBaseInputClasses()}`} placeholder="e.g., property UUID" />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="propertySearchFilter" className="block text-sm font-normal text-gray-700 mb-1">Property Search</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><IconSearch size={16} className="text-gray-400" /></div>
                                            <input type="text" id="propertySearchFilter" value={filters.propertySearchFilter} onChange={(e) => setters.setPropertySearchFilter(e.target.value)} className={`pl-10 ${getBaseInputClasses()}`} placeholder="ID, locality, address..." />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="customerSearchFilter" className="block text-sm font-normal text-gray-700 mb-1">Customer Search</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><IconUserSearch size={16} className="text-gray-400" /></div>
                                            <input type="text" id="customerSearchFilter" value={filters.customerSearchFilter} onChange={(e) => setters.setCustomerSearchFilter(e.target.value)} className={`pl-10 ${getBaseInputClasses()}`} placeholder="Name, email, phone..." />
                                        </div>
                                    </div>

                                    {isSuperAdmin && (
                                        <>
                                            <SearchableSelect
                                                label="Assigned Tenant Telecaller"
                                                value={filters.assignedTTFilter}
                                                onChange={(value) => setters.setAssignedTTFilter(value as string || '')}
                                                fetchOptions={fetchTenantTelecallerAdminOptions}
                                                placeholder="Search Tenant Telecallers..."
                                                icon={<IconUser size={16} />}
                                            />
                                            <SearchableSelect
                                                label="Assigned Sales Admin"
                                                value={filters.assignedSalesFilter}
                                                onChange={(value) => setters.setAssignedSalesFilter(value as string || '')}
                                                fetchOptions={fetchSalesAdminOptions}
                                                placeholder="Search Sales Admins..."
                                                icon={<IconUser size={16} />}
                                            />
                                        </>
                                    )}
                                </div>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <button onClick={onApplyFilters} className={getPrimaryButtonClasses()}>
                                        <IconFilter className="mr-2" size={16} />Apply Filters
                                    </button>
                                    <button onClick={onClearFilters} className={getSecondaryButtonClasses()}>
                                        <IconRefresh className="mr-2" size={16} />Clear Filters
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

export default InteractionFilters;