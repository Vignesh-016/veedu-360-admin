import { FullPropertyDetailsAdminData } from '../../../lib/reports/propertyType';
import { getBaseCardClasses } from '../../../lib/twUtils';
import { JSX } from 'react';

interface PropertyInventoryCardProps {
    propertyData: FullPropertyDetailsAdminData;
    renderDetailItem: (
        label: string,
        value: React.ReactNode | string | number | boolean | null | undefined,
        // ... other params
    ) => JSX.Element | null;
}

const PropertyInventoryCard: React.FC<PropertyInventoryCardProps> = ({
    propertyData,
    renderDetailItem,
}) => {
    if (!propertyData.inventory_details || Object.keys(propertyData.inventory_details).length === 0) {
        return null;
    }

    return (
        <div className={getBaseCardClasses()}>
            <div className="p-5 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-800">Inventory Items</h2></div>
            <dl className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-4">
                {Object.entries(propertyData.inventory_details).map(([key, value]) => (
                    renderDetailItem(key, String(value) || <span className='italic'>N/A</span>)
                ))}
            </dl>
        </div>
    );
};

export default PropertyInventoryCard;