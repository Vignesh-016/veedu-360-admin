import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment } from 'react';
import { IconX, IconBuildingStore, IconUser, IconPhone, IconMail, IconMapPin, IconTools, IconNotes } from '@tabler/icons-react';
import { VendorAdminDetails, ServiceCategory } from '../lib/types';
import * as displayUtils from '../lib/displayUtils';
import { getSecondaryButtonClasses, getVendorStatusBadgeClasses } from '../lib/twUtils';
import { formatTimestamp } from '../lib/utils';

interface VendorDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    vendor: VendorAdminDetails | null;
}

// Define the type for the service object as received in VendorDetails
type VendorService = {
    service_id: number;
    service_name: string;
    category: ServiceCategory | null;
};

function VendorDetailsModal({ isOpen, onClose, vendor }: VendorDetailsModalProps) {
    if (!vendor) {
        return null;
    }

    const renderDetail = (label: string, value: string | number | null | undefined, icon?: React.ReactNode) => {
        if (value === null || value === undefined || value === '') return null;
        return (
            <div className="flex items-start space-x-2">
                {icon && <span className="text-gray-500 mt-0.5">{icon}</span>}
                <div>
                    <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wider">{label}</h4>
                    <p className="text-gray-800 text-sm">{value}</p>
                </div>
            </div>
        );
    };

    // Use the correct type for the service parameter
    const renderService = (service: VendorService) => (
        <li key={service.service_id} className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-md border border-gray-200">
            <IconTools size={14} className="text-gray-500 flex-shrink-0" />
            <span className="text-sm text-gray-800">{service.service_name}</span>
            {service.category && (
                <span className='text-xs text-gray-500'>({displayUtils.getDisplayValue(displayUtils.serviceCategoryMap, service.category)})</span>
            )}
        </li>
    );

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={onClose}>
                {/* Backdrop */}
                <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                </TransitionChild>

                {/* Modal Panel */}
                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                            <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                                {/* Header */}
                                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                                    <div className='flex items-center space-x-2'>
                                        <IconBuildingStore className="h-5 w-5 text-gray-600" />
                                        <h2 className="text-lg font-medium text-gray-900">
                                            Vendor Details: {vendor.company_name}
                                        </h2>
                                        <span className={getVendorStatusBadgeClasses(vendor.status)}>
                                            {displayUtils.getDisplayValue(displayUtils.vendorStatusMap, vendor.status)}
                                        </span>
                                    </div>
                                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors duration-200">
                                        <IconX className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                                    {/* Basic Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {renderDetail("Contact Name", vendor.contact_name, <IconUser size={16} />)}
                                        {renderDetail("Phone", vendor.phone, <IconPhone size={16} />)}
                                        {renderDetail("Email", vendor.email, <IconMail size={16} />)}
                                        {renderDetail("Address", vendor.address, <IconMapPin size={16} />)}
                                    </div>

                                    {/* Services */}
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-800 mb-2 flex items-center">
                                            <IconTools className="mr-2 text-gray-500" size={18} /> Services Offered
                                        </h3>
                                        {vendor.services && vendor.services.length > 0 ? (
                                            <ul className="flex flex-wrap gap-2">
                                                {/* Map uses the correctly typed renderService function */}
                                                {vendor.services.map(renderService)}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">No services assigned.</p>
                                        )}
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-800 mb-2 flex items-center">
                                            <IconNotes className="mr-2 text-gray-500" size={18} /> Internal Notes
                                        </h3>
                                        {vendor.notes ? (
                                            <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-md p-3 whitespace-pre-line">{vendor.notes}</p>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">No internal notes.</p>
                                        )}
                                    </div>

                                    {/* Timestamps */}
                                    <div className="text-xs text-gray-500 mt-4 border-t border-gray-200 pt-3">
                                        <p>Created: {formatTimestamp(vendor.created_at)}</p>
                                        <p>Last Updated: {formatTimestamp(vendor.updated_at)}</p>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="px-6 py-4 border-t border-gray-200 flex justify-end bg-gray-50">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className={getSecondaryButtonClasses()}
                                    >
                                        Close
                                    </button>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

export default VendorDetailsModal;