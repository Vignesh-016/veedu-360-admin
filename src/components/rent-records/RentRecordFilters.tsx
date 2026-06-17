import { Fragment } from 'react';
import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react';
import {
    IconFilter, IconRefresh, IconChevronDown,
    IconUser, IconBuildingSkyscraper, IconCalendar, IconListCheck
} from '@tabler/icons-react';
import { RentStatus } from '../../lib/types';
import { getBaseInputClasses, getPrimaryButtonClasses, getSecondaryButtonClasses } from '../../lib/twUtils';
import * as displayUtils from '../../lib/displayUtils';

const rentStatusOptions: { value: RentStatus; label: string }[] = Object.entries(displayUtils.rentStatusMap)
    .map(([value, label]) => ({ value: value as RentStatus, label }));

interface RentRecordFiltersProps {
    filters: {
        propertyIdFilter: string;
        tenantIdFilter: string;
        landlordIdFilter: string;
        statusFilter: RentStatus | undefined;
        dueDateStartFilter: string;
        dueDateEndFilter: string;
    };
    setters: {
        setPropertyIdFilter: (value: string) => void;
        setTenantIdFilter: (value: string) => void;
        setLandlordIdFilter: (value: string) => void;
        setStatusFilter: (value: RentStatus | undefined) => void;
        setDueDateStartFilter: (value: string) => void;
        setDueDateEndFilter: (value: string) => void;
    };
    onApplyFilters: () => void;
    onClearFilters: () => void;
    isDisclosureOpenByDefault?: boolean;
}

const RentRecordFilters: React.FC<RentRecordFiltersProps> = ({
    filters,
    setters,
    onApplyFilters,
    onClearFilters,
    isDisclosureOpenByDefault = false,
}) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8 transition-all duration-300 hover:shadow-md">
            <Disclosure defaultOpen={isDisclosureOpenByDefault} as="div">
                {({ open }) => (
                    <>
                        <DisclosureButton className="flex justify-between w-full px-6 py-4 text-left text-lg font-medium text-white bg-[#D9A619] hover:bg-[#c89a17] focus:outline-none focus-visible:ring focus-visible:ring-gray-500 focus-visible:ring-opacity-75 rounded-t-xl transition-colors">
                            <span className="flex items-center">
                                <IconFilter className="mr-2 text-white" size={20} />
                                Filter Rent Records
                            </span>
                            <IconChevronDown className={`${open ? 'transform rotate-180' : ''} w-5 h-5 text-white transition-transform`} />
                        </DisclosureButton>
                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-200"
                            enterFrom="opacity-0 -translate-y-1"
                            enterTo="opacity-100 translate-y-0"
                            leave="transition ease-in duration-150"
                            leaveFrom="opacity-100 translate-y-0"
                            leaveTo="opacity-0 -translate-y-1"
                        >
                            <DisclosurePanel className="px-6 pt-4 pb-6 border-t border-gray-100">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                                    <div>
                                        <label htmlFor="statusFilter" className="text-sm font-normal text-gray-700 mb-1 flex items-center"><IconListCheck size={16} className='mr-1 text-gray-400' /> Status</label>
                                        <select id="statusFilter" value={filters.statusFilter || ''} onChange={(e) => setters.setStatusFilter(e.target.value as RentStatus || undefined)} className={getBaseInputClasses()}>
                                            <option value="">All Statuses</option>
                                            {rentStatusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="dueDateStartFilter" className="text-sm font-normal text-gray-700 mb-1 flex items-center"><IconCalendar size={16} className='mr-1 text-gray-400' /> Due Date After</label>
                                        <input type="date" id="dueDateStartFilter" value={filters.dueDateStartFilter} onChange={(e) => setters.setDueDateStartFilter(e.target.value)} className={getBaseInputClasses()} />
                                    </div>
                                    <div>
                                        <label htmlFor="dueDateEndFilter" className="text-sm font-normal text-gray-700 mb-1 flex items-center"><IconCalendar size={16} className='mr-1 text-gray-400' /> Due Date Before</label>
                                        <input type="date" id="dueDateEndFilter" value={filters.dueDateEndFilter} onChange={(e) => setters.setDueDateEndFilter(e.target.value)} className={getBaseInputClasses()} />
                                    </div>
                                    <div>
                                        <label htmlFor="propertyIdFilter" className="text-sm font-normal text-gray-700 mb-1 flex items-center"><IconBuildingSkyscraper size={16} className='mr-1 text-gray-400' /> Property ID</label>
                                        <input type="text" id="propertyIdFilter" value={filters.propertyIdFilter} onChange={(e) => setters.setPropertyIdFilter(e.target.value)} className={getBaseInputClasses()} placeholder="Enter exact Property ID" />
                                    </div>
                                    <div>
                                        <label htmlFor="tenantIdFilter" className="text-sm font-normal text-gray-700 mb-1 flex items-center"><IconUser size={16} className='mr-1 text-gray-400' /> Tenant ID</label>
                                        <input type="text" id="tenantIdFilter" value={filters.tenantIdFilter} onChange={(e) => setters.setTenantIdFilter(e.target.value)} className={getBaseInputClasses()} placeholder="Enter exact User ID" />
                                    </div>
                                    <div>
                                        <label htmlFor="landlordIdFilter" className="text-sm font-normal text-gray-700 mb-1 flex items-center"><IconUser size={16} className='mr-1 text-gray-400' /> Landlord ID</label>
                                        <input type="text" id="landlordIdFilter" value={filters.landlordIdFilter} onChange={(e) => setters.setLandlordIdFilter(e.target.value)} className={getBaseInputClasses()} placeholder="Enter exact User ID" />
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                                    <button onClick={onApplyFilters} className={getPrimaryButtonClasses()}><IconFilter className="mr-2" size={16} />Apply Filters</button>
                                    <button onClick={onClearFilters} className={getSecondaryButtonClasses()}><IconRefresh className="mr-2" size={16} />Clear Filters</button>
                                </div>
                            </DisclosurePanel>
                        </Transition>
                    </>
                )}
            </Disclosure>
        </div>
    );
};

export default RentRecordFilters;