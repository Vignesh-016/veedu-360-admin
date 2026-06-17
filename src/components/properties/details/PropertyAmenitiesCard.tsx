import * as displayUtils from '../../../lib/displayUtils';
import { FullPropertyDetailsAdminData } from '../../../lib/reports/propertyType';
import { getBaseCardClasses } from '../../../lib/twUtils';
import { JSX } from 'react';

interface PropertyAmenitiesCardProps {
    propertyData: FullPropertyDetailsAdminData;
    renderDetailItem: (
        label: string,
        value: React.ReactNode | string | number | boolean | null | undefined,
        // ... other params
    ) => JSX.Element | null;
}

const PropertyAmenitiesCard: React.FC<PropertyAmenitiesCardProps> = ({
    propertyData,
    renderDetailItem,
}) => {
    const hasAmenities = propertyData.nearest_hospital || propertyData.nearest_busstop ||
        propertyData.nearest_gym || propertyData.nearest_park ||
        propertyData.nearest_school || propertyData.nearest_swimmingpool;

    if (!hasAmenities) return null;

    return (
        <div className={getBaseCardClasses()}>
            <div className="p-5 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">
                    Nearby Amenities {propertyData.proximity_unit ? `(${displayUtils.getDisplayValue(displayUtils.proximityUnitMap, propertyData.proximity_unit)})` : ''}
                </h2>
            </div>
            <dl className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-4">
                {renderDetailItem("Hospital", propertyData.nearest_hospital)}
                {renderDetailItem("Bus Stop", propertyData.nearest_busstop)}
                {renderDetailItem("Gym", propertyData.nearest_gym)}
                {renderDetailItem("Park", propertyData.nearest_park)}
                {renderDetailItem("School", propertyData.nearest_school)}
                {renderDetailItem("Swimming Pool", propertyData.nearest_swimmingpool)}
            </dl>
        </div>
    );
};

export default PropertyAmenitiesCard;