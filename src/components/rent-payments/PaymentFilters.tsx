import { Fragment } from 'react';
import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react';
import {
    IconFilter, IconRefresh, IconChevronDown,
    IconUser, IconCalendar, IconReceipt
} from '@tabler/icons-react';
import { getBaseInputClasses, getPrimaryButtonClasses, getSecondaryButtonClasses } from '../../lib/twUtils';

interface PaymentFiltersProps {
    filters: {
        rentPropertyIdFilter: string;
        paidByUserIdFilter: string;
        paymentDateStartFilter: string;
        paymentDateEndFilter: string;
    };
    setters: {
        setRentPropertyIdFilter: (value: string) => void;
        setPaidByUserIdFilter: (value: string) => void;
        setPaymentDateStartFilter: (value: string) => void;
        setPaymentDateEndFilter: (value: string) => void;
    };
    onApplyFilters: () => void;
    onClearFilters: () => void;
    isDisclosureOpenByDefault?: boolean;
}

const PaymentFilters: React.FC<PaymentFiltersProps> = ({
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
                        <DisclosureButton className="flex justify-between w-full px-6 py-4 text-left text-lg font-semibold text-white bg-[#D9A619] hover:bg-[#c89a17] focus:outline-none focus-visible:ring focus-visible:ring-gray-500 focus-visible:ring-opacity-75 rounded-t-xl transition-colors">
                            <span className="flex items-center">
                                <IconFilter className="mr-2 text-white" size={20} />
                                Filter Payments
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
                                        <label htmlFor="rentPropertyIdFilter" className="text-sm font-medium text-gray-700 mb-1 flex items-center"><IconReceipt size={16} className='mr-1 text-gray-400' /> Property ID</label>
                                        <input type="text" id="rentPropertyIdFilter" value={filters.rentPropertyIdFilter} onChange={(e) => setters.setRentPropertyIdFilter(e.target.value)} className={getBaseInputClasses()} placeholder="Enter exact Property ID" />
                                    </div>
                                    <div>
                                        <label htmlFor="paidByUserIdFilter" className="text-sm font-medium text-gray-700 mb-1 flex items-center"><IconUser size={16} className='mr-1 text-gray-400' /> Paid By User ID</label>
                                        <input type="text" id="paidByUserIdFilter" value={filters.paidByUserIdFilter} onChange={(e) => setters.setPaidByUserIdFilter(e.target.value)} className={getBaseInputClasses()} placeholder="Enter exact User ID (Tenant)" />
                                    </div>
                                    <div>
                                        <label htmlFor="paymentDateStartFilter" className="text-sm font-medium text-gray-700 mb-1 flex items-center"><IconCalendar size={16} className='mr-1 text-gray-400' /> Payment (Due) Date After</label>
                                        <input type="date" id="paymentDateStartFilter" value={filters.paymentDateStartFilter} onChange={(e) => setters.setPaymentDateStartFilter(e.target.value)} className={getBaseInputClasses()} />
                                    </div>
                                    <div>
                                        <label htmlFor="paymentDateEndFilter" className="text-sm font-medium text-gray-700 mb-1 flex items-center"><IconCalendar size={16} className='mr-1 text-gray-400' /> Payment (Due) Date Before</label>
                                        <input type="date" id="paymentDateEndFilter" value={filters.paymentDateEndFilter} onChange={(e) => setters.setPaymentDateEndFilter(e.target.value)} className={getBaseInputClasses()} />
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

export default PaymentFilters;