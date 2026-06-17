import { Fragment } from 'react';
import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react';
import {
    IconFilter, IconChevronDown, IconBuildingSkyscraper, IconTag, IconCoinRupee,
    IconMapPin, IconCheckbox, IconCertificate, IconSearch, IconUserSearch, IconListCheck,
    IconRefresh, IconEye
} from '@tabler/icons-react';
import {
    PropertyType, ListingType, PropertyAdminStatus, ManagementPlanInfo
} from '../../lib/types';
import * as displayUtils from '../../lib/displayUtils';
import { getBaseInputClasses, getPrimaryButtonClasses, getSecondaryButtonClasses } from '../../lib/twUtils';
import SearchableSelect from '../SearchableSelect';
import api from '../../lib/supabaseClient';

// PropertyType and ListingType options remain the same
const propertyTypeOptions: { value: PropertyType; label: string }[] = Object.entries(displayUtils.propertyTypeMap)
    .map(([value, label]) => ({ value: value as PropertyType, label }));

const listingTypeOptions: { value: ListingType; label: string }[] = Object.entries(displayUtils.listingTypeMap)
    .map(([value, label]) => ({ value: value as ListingType, label }));

// Updated: Use new PropertyAdminStatus enum and map
const propertyAdminStatusOptions: { value: PropertyAdminStatus; label: string }[] = Object.entries(displayUtils.propertyAdminStatusMap)
    .map(([value, label]) => ({ value: value as PropertyAdminStatus, label }));

interface PropertyFiltersProps {
    filters: {
        propertyTypeFilter: PropertyType[];
        listingTypeFilter: ListingType[];
        statusesFilter: PropertyAdminStatus[];
        isListedFilter: boolean | undefined;
        isExclusiveFilter: boolean | undefined;
        priceMinFilter: number | undefined;
        priceMaxFilter: number | undefined;
        cityFilter: string;
        pincodeFilter: string;
        propertySearch: string;
        managementPlanFilter: string | undefined;
        submitterIdFilter: string | undefined;
        tenantIdFilter: string | undefined;
    };
    setters: {
        setPropertyTypeFilter: React.Dispatch<React.SetStateAction<PropertyType[]>>;
        setListingTypeFilter: React.Dispatch<React.SetStateAction<ListingType[]>>;
        setStatusesFilter: React.Dispatch<React.SetStateAction<PropertyAdminStatus[]>>;
        setIsListedFilter: React.Dispatch<React.SetStateAction<boolean | undefined>>;
        setIsExclusiveFilter: React.Dispatch<React.SetStateAction<boolean | undefined>>;
        setPriceMinFilter: React.Dispatch<React.SetStateAction<number | undefined>>;
        setPriceMaxFilter: React.Dispatch<React.SetStateAction<number | undefined>>;
        setCityFilter: React.Dispatch<React.SetStateAction<string>>;
        setPincodeFilter: React.Dispatch<React.SetStateAction<string>>;
        setPropertySearch: React.Dispatch<React.SetStateAction<string>>;
        setManagementPlanFilter: React.Dispatch<React.SetStateAction<string | undefined>>;
        setSubmitterIdFilter: React.Dispatch<React.SetStateAction<string | undefined>>;
        setTenantIdFilter: React.Dispatch<React.SetStateAction<string | undefined>>;
    };
    allManagementPlans: ManagementPlanInfo[];
    onApplyFilters: () => void;
    onClearFilters: () => void;
    isDisclosureOpenByDefault?: boolean;
}

const PropertyFilters: React.FC<PropertyFiltersProps> = ({
    filters,
    setters,
    allManagementPlans,
    onApplyFilters,
    onClearFilters,
    isDisclosureOpenByDefault = false,
}) => {

    const handlePropertyTypeCheckboxChange = (typeValue: PropertyType) => {
        setters.setPropertyTypeFilter(prev =>
            prev.includes(typeValue) ? prev.filter(t => t !== typeValue) : [...prev, typeValue]
        );
    };

    const handleListingTypeCheckboxChange = (typeValue: ListingType) => {
        setters.setListingTypeFilter(prev =>
            prev.includes(typeValue) ? prev.filter(t => t !== typeValue) : [...prev, typeValue]
        );
    };

    // Updated: Use new PropertyAdminStatus type
    const handlePropertyAdminStatusCheckboxChange = (statusValue: PropertyAdminStatus) => {
        setters.setStatusesFilter(prev =>
            prev.includes(statusValue) ? prev.filter(s => s !== statusValue) : [...prev, statusValue]
        );
    };

    const fetchUserOptions = async (query: string): Promise<{ value: string; label: string }[]> => {
        const { data, error: userError } = await api.searchCustomers(query, undefined, 0, 20);
        if (userError) {
            console.error("Error fetching users for filter:", userError);
            return [];
        }
        return (data || []).map((user) => ({
            value: user.user_id,
            label: `${user.full_name ?? 'N/A'} (${user.email ?? 'No Email'})`,
        }));
    };


    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8 transition-all duration-300 hover:shadow-md">
            <Disclosure defaultOpen={isDisclosureOpenByDefault} as="div">
                {({ open }) => (
                    <>
                        <DisclosureButton className="flex justify-between w-full px-6 py-4 text-left text-lg font-medium text-gray-800 bg-white hover:bg-gray-50 focus:outline-none focus:ring-0 rounded-t-xl transition-colors">
                            <span className="flex items-center">
                                <IconFilter className="mr-2 text-[#D9A619]" size={22} stroke={2.5} />
                                Filter Properties
                            </span>
                            <div className={`p-1 rounded-full transition-colors ${open ? 'bg-[#D9A619] text-white' : 'bg-gray-100 text-gray-400'}`}>
                                <IconChevronDown className={`${open ? 'transform rotate-180' : ''} w-4 h-4 transition-transform`} />
                            </div>
                        </DisclosureButton>
                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-200" enterFrom="opacity-0 -translate-y-1" enterTo="opacity-100 translate-y-0"
                            leave="transition ease-in duration-150" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 -translate-y-1"
                        >
                            <DisclosurePanel className="px-6 pt-4 pb-6 border-t border-gray-100">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-5">
                                    {/* Property Type Filter */}
                                    <div className="col-span-full sm:col-span-1">
                                        <label className="text-sm font-normal text-gray-700 mb-2 flex items-center"><IconBuildingSkyscraper size={16} className="mr-1 text-gray-400" /> Property Type</label>
                                        <div className="space-y-1.5 max-h-32 overflow-y-auto border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                                            {propertyTypeOptions.map((option) => (
                                                <div key={option.value} className="flex items-center group">
                                                    <input
                                                        id={`propType-${option.value}`}
                                                        name="propertyTypeFilter"
                                                        type="checkbox"
                                                        value={option.value}
                                                        checked={filters.propertyTypeFilter.includes(option.value)}
                                                        onChange={() => handlePropertyTypeCheckboxChange(option.value)}
                                                        className="h-4 w-4 text-[#D9A619] border-gray-300 rounded focus:ring-[#D9A619]"
                                                    />
                                                    <label htmlFor={`propType-${option.value}`} className="ml-2 block text-sm text-gray-600 group-hover:text-gray-900 cursor-pointer">
                                                        {option.label}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Listing Type Filter */}
                                    <div className="col-span-full sm:col-span-1">
                                        <label className="text-sm font-normal text-gray-700 mb-2 flex items-center"><IconTag size={16} className="mr-1 text-gray-400" /> Listing Type</label>
                                        <div className="space-y-1.5 max-h-24 overflow-y-auto border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                                            {listingTypeOptions.map((option) => (
                                                <div key={option.value} className="flex items-center group">
                                                    <input
                                                        id={`listType-${option.value}`}
                                                        name="listingTypeFilter"
                                                        type="checkbox"
                                                        value={option.value}
                                                        checked={filters.listingTypeFilter.includes(option.value)}
                                                        onChange={() => handleListingTypeCheckboxChange(option.value)}
                                                        className="h-4 w-4 text-[#D9A619] border-gray-300 rounded focus:ring-[#D9A619]"
                                                    />
                                                    <label htmlFor={`listType-${option.value}`} className="ml-2 block text-sm text-gray-600 group-hover:text-gray-900 cursor-pointer">
                                                        {option.label}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Admin Status Filter */}
                                    <div className="col-span-full sm:col-span-1">
                                        <label className="text-sm font-normal text-gray-700 mb-2 flex items-center"><IconListCheck size={16} className="mr-1 text-gray-400" /> Admin Status</label>
                                        <div className="space-y-1.5 max-h-32 overflow-y-auto border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                                            {propertyAdminStatusOptions.map((option) => (
                                                <div key={option.value} className="flex items-center group">
                                                    <input
                                                        id={`propAdminStatus-${option.value}`}
                                                        name="statusesFilter"
                                                        type="checkbox"
                                                        value={option.value}
                                                        checked={filters.statusesFilter.includes(option.value)}
                                                        onChange={() => handlePropertyAdminStatusCheckboxChange(option.value)}
                                                        className="h-4 w-4 text-[#D9A619] border-gray-300 rounded focus:ring-[#D9A619]"
                                                    />
                                                    <label htmlFor={`propAdminStatus-${option.value}`} className="ml-2 block text-sm text-gray-600 group-hover:text-gray-900 cursor-pointer">
                                                        {option.label}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Price Filters */}
                                    <div className="col-span-full sm:col-span-1 space-y-4">
                                        <div><label htmlFor="priceMinFilter" className="text-sm font-normal text-gray-700 mb-1 flex items-center"><IconCoinRupee size={16} className="mr-1 text-gray-400" /> Min Price (₹)</label><input type="number" id="priceMinFilter" value={filters.priceMinFilter ?? ''} onChange={(e) => setters.setPriceMinFilter(e.target.value === '' ? undefined : Number(e.target.value))} className={getBaseInputClasses()} placeholder="0" min="0" /></div>
                                        <div><label htmlFor="priceMaxFilter" className="text-sm font-normal text-gray-700 mb-1 flex items-center"><IconCoinRupee size={16} className="mr-1 text-gray-400" /> Max Price (₹)</label><input type="number" id="priceMaxFilter" value={filters.priceMaxFilter ?? ''} onChange={(e) => setters.setPriceMaxFilter(e.target.value === '' ? undefined : Number(e.target.value))} className={getBaseInputClasses()} placeholder="Any" min="0" /></div>
                                    </div>
                                    {/* Location Filters */}
                                    <div className="col-span-full sm:col-span-1 space-y-4">
                                        <div><label htmlFor="cityFilter" className="text-sm font-normal text-gray-700 mb-1 flex items-center"><IconMapPin size={16} className="mr-1 text-gray-400" /> City</label><input type="text" id="cityFilter" value={filters.cityFilter} onChange={(e) => setters.setCityFilter(e.target.value)} className={getBaseInputClasses()} placeholder="e.g., Tirunelveli" /></div>
                                        <div><label htmlFor="pincodeFilter" className="text-sm font-normal text-gray-700 mb-1 flex items-center"><IconMapPin size={16} className="mr-1 text-gray-400" /> Pincode</label><input type="text" id="pincodeFilter" value={filters.pincodeFilter} onChange={(e) => setters.setPincodeFilter(e.target.value)} className={getBaseInputClasses()} placeholder="e.g., 627003" /></div>
                                    </div>
                                    {/* Search & Plan Filters */}
                                    <div className="col-span-full sm:col-span-1 space-y-4">
                                        <div><label htmlFor="propertySearch" className="text-sm font-normal text-gray-700 mb-1 flex items-center"><IconSearch size={16} className="mr-1 text-gray-400" /> General Search</label><input type="text" id="propertySearch" value={filters.propertySearch} onChange={(e) => setters.setPropertySearch(e.target.value)} className={getBaseInputClasses()} placeholder="ID, address, owner..." /></div>
                                        <div>
                                            <label htmlFor="managementPlanFilter" className="text-sm font-normal text-gray-700 mb-1 flex items-center"><IconCertificate size={16} className="mr-1 text-gray-400" /> Management Plan</label>
                                            <select id="managementPlanFilter" value={filters.managementPlanFilter ?? ''} onChange={(e) => setters.setManagementPlanFilter(e.target.value || undefined)} className={getBaseInputClasses()}>
                                                <option value="">All Plans</option>
                                                {allManagementPlans.map(plan => (<option key={plan.plan_id} value={plan.plan_id}>{plan.name} ({plan.percentage}%)</option>))}
                                            </select>
                                        </div>
                                    </div>
                                    {/* Boolean Flags & User Filters */}
                                    <div className="col-span-full sm:col-span-1 space-y-4">
                                        {/* isListedFilter */}
                                        <div>
                                            <label htmlFor="isListedFilter" className="text-sm font-normal text-gray-700 mb-1 flex items-center"><IconEye size={16} className="mr-1 text-gray-400" /> Publicly Listed</label>
                                            <select id="isListedFilter" value={filters.isListedFilter === undefined ? 'ALL' : (filters.isListedFilter ? 'YES' : 'NO')} onChange={(e) => { if (e.target.value === 'ALL') setters.setIsListedFilter(undefined); else setters.setIsListedFilter(e.target.value === 'YES'); }} className={getBaseInputClasses()}>
                                                <option value="ALL">Any</option><option value="YES">Yes</option><option value="NO">No</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="isExclusiveFilter" className="text-sm font-normal text-gray-700 mb-1 flex items-center"><IconCheckbox size={16} className="mr-1 text-gray-400" /> Exclusive Listing</label>
                                            <select id="isExclusiveFilter" value={filters.isExclusiveFilter === undefined ? 'ALL' : (filters.isExclusiveFilter ? 'YES' : 'NO')} onChange={(e) => { if (e.target.value === 'ALL') setters.setIsExclusiveFilter(undefined); else setters.setIsExclusiveFilter(e.target.value === 'YES'); }} className={getBaseInputClasses()}>
                                                <option value="ALL">Any</option><option value="YES">Yes</option><option value="NO">No</option>
                                            </select>
                                        </div>
                                    </div>
                                    {/* User Filters */}
                                    <div className="col-span-full sm:col-span-1 space-y-4">
                                        <SearchableSelect label="Submitter (Owner)" value={filters.submitterIdFilter} onChange={(value) => setters.setSubmitterIdFilter(value as string | undefined)} fetchOptions={fetchUserOptions} placeholder="Search Owner..." icon={<IconUserSearch size={16} />} />
                                        <SearchableSelect label="Tenant (Occupied By)" value={filters.tenantIdFilter} onChange={(value) => setters.setTenantIdFilter(value as string | undefined)} fetchOptions={fetchUserOptions} placeholder="Search Tenant..." icon={<IconUserSearch size={16} />} />
                                    </div>
                                </div>
                                <div className="mt-6 flex flex-wrap gap-3 border-t border-gray-100 pt-6">
                                    <button onClick={onApplyFilters} className={`${getPrimaryButtonClasses()} !rounded-full px-8`}>
                                        <IconFilter className="mr-2" size={18} /> Apply Filters
                                    </button>
                                    <button onClick={onClearFilters} className={`${getSecondaryButtonClasses()} !rounded-full px-8`}>
                                        <IconRefresh className="mr-2" size={18} /> Clear
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

export default PropertyFilters;