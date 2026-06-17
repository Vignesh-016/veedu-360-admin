import { Fragment } from 'react';
import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react';
import {
    IconFilter, IconChevronDown, IconUserSearch, IconBuildingSkyscraper,
    IconCalendar, IconRefresh, IconListCheck
} from '@tabler/icons-react';
import { RentalApplicationStatus } from '../../lib/types';
import * as displayUtils from '../../lib/displayUtils';
import { getBaseInputClasses, getPrimaryButtonClasses, getSecondaryButtonClasses } from '../../lib/twUtils';
import SearchableSelect from '../SearchableSelect';
import api from '../../lib/supabaseClient';

const applicationStatusOptions: { value: RentalApplicationStatus; label: string }[] = Object.entries(displayUtils.rentalApplicationStatusMap)
    .map(([value, label]) => ({ value: value as RentalApplicationStatus, label }));

const fetchAdminAssigneeOptions = async (query: string): Promise<{ value: string; label: string }[]> => {
    const { data, error: adminError } = await api.listAdmins(undefined, true, query, 0, 20);
    if (adminError) {
        console.error("Error fetching admins for assignment:", adminError);
        return [];
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


interface RentalApplicationFiltersProps {
    filters: {
        statusFilter: RentalApplicationStatus[];
        assignedAdminFilter: string | undefined;
        propertySearchFilter: string;
        applicantSearchFilter: string;
        landlordSearchFilter: string;
        submissionDateStartFilter: string;
        submissionDateEndFilter: string;
        moveInDateStartFilter: string;
        moveInDateEndFilter: string;
    };
    setters: {
        setStatusFilter: (value: RentalApplicationStatus[]) => void;
        setAssignedAdminFilter: (value: string | undefined) => void;
        setPropertySearchFilter: (value: string) => void;
        setApplicantSearchFilter: (value: string) => void;
        setLandlordSearchFilter: (value: string) => void;
        setSubmissionDateStartFilter: (value: string) => void;
        setSubmissionDateEndFilter: (value: string) => void;
        setMoveInDateStartFilter: (value: string) => void;
        setMoveInDateEndFilter: (value: string) => void;
    };
    onApplyFilters: () => void;
    onClearFilters: () => void;
    isSuperAdmin: boolean;
    isDisclosureOpenByDefault?: boolean;
}

const RentalApplicationFilters: React.FC<RentalApplicationFiltersProps> = ({
    filters,
    setters,
    onApplyFilters,
    onClearFilters,
    isSuperAdmin,
    isDisclosureOpenByDefault = false,
}) => {

    const handleStatusCheckboxChange = (statusValue: RentalApplicationStatus) => {
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
                        <DisclosureButton className="flex justify-between w-full px-6 py-4 text-left focus:outline-none rounded-t-xl transition-all duration-200 group bg-white hover:bg-slate-50 border-b border-gray-100">
                            <span className="flex items-center text-slate-800 font-medium tracking-tight">
                                <div className={`p-2 rounded-lg mr-3 transition-colors ${open ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-600'}`}>
                                    <IconFilter size={18} />
                                </div>
                                Advanced Filters
                            </span>
                            <div className={`p-1.5 rounded-full transition-all duration-300 ${open ? 'bg-slate-100 rotate-180 text-slate-900' : 'bg-transparent text-slate-400 group-hover:bg-gray-100 group-hover:text-slate-600'}`}>
                                <IconChevronDown size={20} />
                            </div>
                        </DisclosureButton>
                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-200" enterFrom="opacity-0 -translate-y-2 scale-[0.98]" enterTo="opacity-100 translate-y-0 scale-100"
                            leave="transition ease-in duration-150" leaveFrom="opacity-100 translate-y-0 scale-100" leaveTo="opacity-0 -translate-y-2 scale-[0.98]"
                        >
                            <DisclosurePanel className="px-6 pt-6 pb-6 bg-white rounded-b-xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
                                    {/* Status Filter */}
                                    <div className="col-span-full sm:col-span-1">
                                        <label className="block text-[11px] font-normal text-slate-500 uppercase tracking-wider mb-1.5 flex items-center">
                                            <IconListCheck size={14} className="mr-1.5 opacity-60" /> Status
                                        </label>
                                        <div className="space-y-2 max-h-32 overflow-y-auto p-3 border border-gray-100 rounded-xl bg-slate-50/50 custom-scrollbar">
                                            {applicationStatusOptions.map((option) => (
                                                <div key={option.value} className="flex items-center group cursor-pointer">
                                                    <input
                                                        id={`status-${option.value}`}
                                                        name="statusFilter"
                                                        type="checkbox"
                                                        value={option.value}
                                                        checked={filters.statusFilter.includes(option.value)}
                                                        onChange={() => handleStatusCheckboxChange(option.value)}
                                                        className="h-4 w-4 text-slate-900 border-gray-300 rounded focus:ring-slate-500 transition-colors"
                                                    />
                                                    <label htmlFor={`status-${option.value}`} className="ml-2.5 block text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors cursor-pointer">{option.label}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Search Filters */}
                                    <div>
                                        <label htmlFor="propertySearchFilter" className="block text-[11px] font-normal text-slate-500 uppercase tracking-wider mb-1.5 flex items-center">
                                            <IconBuildingSkyscraper size={14} className="mr-1.5 opacity-60" /> Property Search
                                        </label>
                                        <input type="text" id="propertySearchFilter" value={filters.propertySearchFilter} onChange={(e) => setters.setPropertySearchFilter(e.target.value)} className={getBaseInputClasses()} placeholder="Address, ID..." />
                                    </div>
                                    <div>
                                        <label htmlFor="applicantSearchFilter" className="block text-[11px] font-normal text-slate-500 uppercase tracking-wider mb-1.5 flex items-center">
                                            <IconUserSearch size={14} className="mr-1.5 opacity-60" /> Applicant Search
                                        </label>
                                        <input type="text" id="applicantSearchFilter" value={filters.applicantSearchFilter} onChange={(e) => setters.setApplicantSearchFilter(e.target.value)} className={getBaseInputClasses()} placeholder="Name, email, phone..." />
                                    </div>
                                    <div>
                                        <label htmlFor="landlordSearchFilter" className="block text-[11px] font-normal text-slate-500 uppercase tracking-wider mb-1.5 flex items-center">
                                            <IconUserSearch size={14} className="mr-1.5 opacity-60" /> Landlord Search
                                        </label>
                                        <input type="text" id="landlordSearchFilter" value={filters.landlordSearchFilter} onChange={(e) => setters.setLandlordSearchFilter(e.target.value)} className={getBaseInputClasses()} placeholder="Name, email..." />
                                    </div>

                                    {/* Assigned Admin Filter (Super Admin only) */}
                                    {isSuperAdmin && (
                                        <SearchableSelect
                                            label="Assigned Admin"
                                            value={filters.assignedAdminFilter}
                                            onChange={(value) => setters.setAssignedAdminFilter(value as string | undefined)}
                                            fetchOptions={fetchAdminAssigneeOptions}
                                            placeholder="Search Admins..."
                                            icon={<IconUserSearch size={14} />}
                                        />
                                    )}

                                    {/* Date Filters */}
                                    <div>
                                        <label htmlFor="submissionDateStartFilter" className="block text-[11px] font-normal text-slate-500 uppercase tracking-wider mb-1.5 flex items-center">
                                            <IconCalendar size={14} className="mr-1.5 opacity-60" /> Submitted After
                                        </label>
                                        <input type="date" id="submissionDateStartFilter" value={filters.submissionDateStartFilter} onChange={(e) => setters.setSubmissionDateStartFilter(e.target.value)} className={getBaseInputClasses()} />
                                    </div>
                                    <div>
                                        <label htmlFor="submissionDateEndFilter" className="block text-[11px] font-normal text-slate-500 uppercase tracking-wider mb-1.5 flex items-center">
                                            <IconCalendar size={14} className="mr-1.5 opacity-60" /> Submitted Before
                                        </label>
                                        <input type="date" id="submissionDateEndFilter" value={filters.submissionDateEndFilter} onChange={(e) => setters.setSubmissionDateEndFilter(e.target.value)} className={getBaseInputClasses()} />
                                    </div>
                                    <div>
                                        <label htmlFor="moveInDateStartFilter" className="block text-[11px] font-normal text-slate-500 uppercase tracking-wider mb-1.5 flex items-center">
                                            <IconCalendar size={14} className="mr-1.5 opacity-60" /> Proposed Move-in After
                                        </label>
                                        <input type="date" id="moveInDateStartFilter" value={filters.moveInDateStartFilter} onChange={(e) => setters.setMoveInDateStartFilter(e.target.value)} className={getBaseInputClasses()} />
                                    </div>
                                    <div>
                                        <label htmlFor="moveInDateEndFilter" className="block text-[11px] font-normal text-slate-500 uppercase tracking-wider mb-1.5 flex items-center">
                                            <IconCalendar size={14} className="mr-1.5 opacity-60" /> Proposed Move-in Before
                                        </label>
                                        <input type="date" id="moveInDateEndFilter" value={filters.moveInDateEndFilter} onChange={(e) => setters.setMoveInDateEndFilter(e.target.value)} className={getBaseInputClasses()} />
                                    </div>
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

export default RentalApplicationFilters;