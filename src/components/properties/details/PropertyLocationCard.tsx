import {
    IconMapPin, IconLocation, IconWorldLatitude, IconWorldLongitude
} from '@tabler/icons-react';
import MapViewer from '../../MapViewer';
import { getBaseCardClasses } from '../../../lib/twUtils';
import { JSX } from 'react';
import { FullPropertyDetailsAdminData } from '../../../lib/reports/propertyType';

interface PropertyLocationCardProps {
    propertyData: FullPropertyDetailsAdminData;
    renderDetailItem: (
        label: string,
        value: React.ReactNode | string | number | boolean | null | undefined,
        icon?: React.ReactNode,
        unit?: string,
        isDate?: boolean,
        isTimestamp?: boolean,
        copyId?: string | null,
        noFormat?: boolean,
    ) => JSX.Element | null;
}

const PropertyLocationCard: React.FC<PropertyLocationCardProps> = ({
    propertyData,
    renderDetailItem,
}) => {
    return (
        <div className={getBaseCardClasses()}>
            <div className="p-5 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-800">Location Details</h2></div>
            <dl className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                {renderDetailItem("Full Address", propertyData.address, <IconLocation size={14} />)}
                {renderDetailItem("Locality", propertyData.locality, <IconMapPin size={14} />)}
                {renderDetailItem("City", propertyData.city, <IconMapPin size={14} />)}
                {renderDetailItem("Pincode", propertyData.pincode, <IconMapPin size={14} />, "", false, false, null, true)}
                {renderDetailItem("Latitude", propertyData.latitude, <IconWorldLatitude size={14} />)}
                {renderDetailItem("Longitude", propertyData.longitude, <IconWorldLongitude size={14} />)}
            </dl>
            {propertyData.latitude && propertyData.longitude && (
                <div className='mt-4 px-5 pb-5'>
                    <MapViewer
                        latitude={propertyData.latitude}
                        longitude={propertyData.longitude}
                        popupText={propertyData.address || 'Property Location'}
                    />
                </div>
            )}
        </div>
    );
};

export default PropertyLocationCard;