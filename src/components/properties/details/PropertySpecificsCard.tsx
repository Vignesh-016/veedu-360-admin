import {
    IconHomeCheck, IconBed, IconArmchair, IconLayoutGrid, IconCompass,
    IconDimensions, IconRoad, IconToolsKitchen2, IconNumber, IconBuilding
} from '@tabler/icons-react';
import { HouseDetailsJson, LandDetailsJson, BuildingDetailsJson } from '../../../lib/types';
import * as displayUtils from '../../../lib/displayUtils';
import { getBaseCardClasses } from '../../../lib/twUtils';
import { Json } from '../../../database.types';
import { FullPropertyDetailsAdminData } from '../../../lib/reports/propertyType';
import { JSX } from 'react';

const getTypedDetails = <T extends object>(details: Json | undefined | null): T | {} => {
    if (typeof details === 'object' && details !== null && !Array.isArray(details)) {
        return details as T;
    }
    return {};
};

interface PropertySpecificsCardProps {
    propertyData: FullPropertyDetailsAdminData;
    renderDetailItem: (
        label: string,
        value: React.ReactNode | string | number | boolean | null | undefined,
        icon?: React.ReactNode,
    ) => JSX.Element | null;
}

const PropertySpecificsCard: React.FC<PropertySpecificsCardProps> = ({
    propertyData,
    renderDetailItem,
}) => {
    const houseDetails = getTypedDetails<HouseDetailsJson>(propertyData.details) as HouseDetailsJson | {};
    const landDetails = getTypedDetails<LandDetailsJson>(propertyData.details) as LandDetailsJson | {};
    const buildingDetails = getTypedDetails<BuildingDetailsJson>(propertyData.details) as BuildingDetailsJson | {};

    return (
        <div className={getBaseCardClasses()}>
            <div className="p-5 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-800">Property Specifics</h2></div>
            <dl className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-4">
                {propertyData.property_type === 'HOUSE' && 'house_type' in houseDetails && (
                    <>
                        {renderDetailItem("House Type", displayUtils.getDisplayValue(displayUtils.houseTypeMap, houseDetails.house_type), <IconHomeCheck size={14} />)}
                        {renderDetailItem("House Name", houseDetails.house_name)}
                        {renderDetailItem("Bedrooms", houseDetails.num_bedrooms, <IconBed size={14} />)}
                        {renderDetailItem("Bathrooms", houseDetails.num_bathrooms, <IconNumber size={14} />)}
                        {renderDetailItem("Balconies", houseDetails.num_balconies, <IconNumber size={14} />)}
                        {renderDetailItem("Total Floors (Building)", houseDetails.total_floors, <IconBuilding size={14} />)}
                        {renderDetailItem("Floor Number", houseDetails.floor_number, <IconBuilding size={14} />)}
                        {renderDetailItem("Car Parking", houseDetails.num_carparking, <IconNumber size={14} />)}
                        {renderDetailItem("Furnishing", displayUtils.getDisplayValue(displayUtils.furnishedStatusMap, houseDetails.furnished_status), <IconArmchair size={14} />)}
                        {renderDetailItem("Facing Direction", displayUtils.getDisplayValue(displayUtils.directionMap, houseDetails.facing_direction), <IconCompass size={14} />)}
                        {renderDetailItem("Corner Plot", houseDetails.is_corner_plot)}
                        {renderDetailItem("Water Source", displayUtils.getDisplayValue(displayUtils.waterSourceMap, houseDetails.water_source), <IconToolsKitchen2 size={14} />)}
                        {renderDetailItem("Power Backup", displayUtils.getDisplayValue(displayUtils.powerBackupMap, houseDetails.power_backup))}
                    </>
                )}
                {propertyData.property_type === 'LAND' && 'land_type' in landDetails && (
                    <>
                        {renderDetailItem("Land Type", displayUtils.getDisplayValue(displayUtils.landTypeMap, landDetails.land_type))}
                        {renderDetailItem("Plot Dimensions", landDetails.plot_dimensions, <IconDimensions size={14} />)}
                        {renderDetailItem("Road Access Width", landDetails.road_access_width_ft + ' ft.', <IconRoad size={14} />)}
                    </>
                )}
                {propertyData.property_type === 'BUILDING' && 'building_type' in buildingDetails && (
                    <>
                        {renderDetailItem("Building Type", displayUtils.getDisplayValue(displayUtils.buildingTypeMap, buildingDetails.building_type))}
                        {renderDetailItem("Building Name", buildingDetails.building_name)}
                        {renderDetailItem("Total Floors", buildingDetails.total_floors, <IconBuilding size={14} />)}
                        {renderDetailItem("Total Units", buildingDetails.num_units, <IconLayoutGrid size={14} />)}
                        {renderDetailItem("Available Units", buildingDetails.available_units, <IconHomeCheck size={14} />)}
                        {renderDetailItem("Common Amenities", buildingDetails.common_amenities?.join(', '))}
                    </>
                )}
            </dl>
        </div>
    );
};

export default PropertySpecificsCard;