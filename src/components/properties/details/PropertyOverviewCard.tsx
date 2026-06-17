import { Switch } from '@headlessui/react';
import {
    IconBuilding, IconTag, IconCoinRupee, IconRuler, IconEye, IconCircleCheck,
    IconSparkles, IconHandGrab, IconCalendar, IconHourglassHigh
} from '@tabler/icons-react';
import { PropertyAdminStatus } from '../../../lib/types';
import * as displayUtils from '../../../lib/displayUtils';
import {
    getPropertyTypeBadgeClasses, getListingTypeBadgeClasses,
    getPropertyAdminStatusBadgeClasses, getAvailabilityStatusBadgeClasses, getBaseCardClasses
} from '../../../lib/twUtils';
import LoadingSpinner from '../../LoadingSpinner';
import { FullPropertyDetailsAdminData } from '../../../lib/reports/propertyType';
import { JSX } from 'react';

interface PropertyOverviewCardProps {
    propertyData: FullPropertyDetailsAdminData;
    renderDetailItem: (
        label: string,
        value: React.ReactNode | string | number | boolean | null | undefined,
        icon?: React.ReactNode,
        unit?: string,
        isDate?: boolean,
        isTimestamp?: boolean,
        copyId?: string | null
    ) => JSX.Element | null;
    canToggleListingStatus: () => boolean;
    isUpdatingListedStatus: boolean;
    onToggleListedStatus: () => void;
}

const PropertyOverviewCard: React.FC<PropertyOverviewCardProps> = ({
    propertyData,
    renderDetailItem,
    canToggleListingStatus,
    isUpdatingListedStatus,
    onToggleListedStatus,
}) => {
    return (
        <div className={getBaseCardClasses()}>
            <div className="p-5 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Property Overview</h2>
            </div>
            <dl className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-4">
                {renderDetailItem("Property Type", <span className={getPropertyTypeBadgeClasses(propertyData.property_type)}>{displayUtils.getDisplayValue(displayUtils.propertyTypeMap, propertyData.property_type)}</span>, <IconBuilding size={14} />)}
                {renderDetailItem("Listing Type", <span className={getListingTypeBadgeClasses(propertyData.listing_type)}>{displayUtils.getDisplayValue(displayUtils.listingTypeMap, propertyData.listing_type)}</span>, <IconTag size={14} />)}
                {renderDetailItem("Admin Status", <span className={getPropertyAdminStatusBadgeClasses(propertyData.admin_status)}>{displayUtils.getDisplayValue(displayUtils.propertyAdminStatusMap, propertyData.admin_status as PropertyAdminStatus)}</span>, <IconCircleCheck size={14} />)}

                {canToggleListingStatus() ? (
                    <div className="mb-2 col-span-1">
                        <dt className="text-xs font-medium text-gray-500 flex items-center">
                            <IconEye size={14} className="mr-1.5" /> Publicly Listed
                        </dt>
                        <dd className="text-sm text-gray-800 flex items-center mt-1">
                            <Switch
                                checked={propertyData.is_listed}
                                onChange={onToggleListedStatus}
                                disabled={isUpdatingListedStatus}
                                className={`${propertyData.is_listed ? 'bg-green-600' : 'bg-gray-200'}
                                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                            >
                                {isUpdatingListedStatus && <LoadingSpinner size={14} className="absolute inset-0 m-auto text-white" />}
                                <span
                                    className={`${propertyData.is_listed ? 'translate-x-6' : 'translate-x-1'}
                                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                />
                            </Switch>
                            <span className={`ml-3 ${propertyData.is_listed ? 'text-green-700' : 'text-gray-600'}`}>
                                {propertyData.is_listed ? 'Yes' : 'No'}
                            </span>
                        </dd>
                    </div>
                ) : (
                    renderDetailItem("Publicly Listed", propertyData.is_listed, <IconEye size={14} />)
                )}

                {renderDetailItem("Price", propertyData.price, <IconCoinRupee size={14} />, ' INR')}
                {propertyData.advance_amount !== null && renderDetailItem("Advance Amount", propertyData.advance_amount, <IconCoinRupee size={14} />, ' INR')}
                {renderDetailItem("Area", propertyData.area, <IconRuler size={14} />, ` ${displayUtils.getDisplayValue(displayUtils.areaUnitMap, propertyData.area_unit)}`)}
                {renderDetailItem("Availability", propertyData.availability_status ? <span className={getAvailabilityStatusBadgeClasses(propertyData.availability_status)}>{displayUtils.getDisplayValue(displayUtils.availabilityStatusMap, propertyData.availability_status)}</span> : 'N/A', <IconHourglassHigh size={14} />)}
                {renderDetailItem("Featured Listing", propertyData.is_featured, <IconSparkles size={14} />)}
                {renderDetailItem("Exclusive Listing", propertyData.is_exclusive, <IconHandGrab size={14} />)}
                {renderDetailItem("Year Built", propertyData.year_built, <IconCalendar size={14} />)}
                {propertyData.listing_type === 'RENTAL' && renderDetailItem("Rent Due Day", propertyData.rent_due_day ? `Day ${propertyData.rent_due_day}` : 'N/A', <IconCalendar size={14} />)}
            </dl>
        </div>
    );
};

export default PropertyOverviewCard;