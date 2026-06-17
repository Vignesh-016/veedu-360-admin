import { IconCalendar } from '@tabler/icons-react';
import { getBaseCardClasses } from '../../../lib/twUtils';
import { JSX } from 'react';
import { FullPropertyDetailsAdminData } from '../../../lib/reports/propertyType';

interface PropertyTimestampsCardProps {
    propertyData: FullPropertyDetailsAdminData;
    renderDetailItem: (
        label: string,
        value: React.ReactNode | string | number | boolean | null | undefined,
        icon?: React.ReactNode,
        unit?: string,
        isDate?: boolean,
        isTimestamp?: boolean,
        // ... other params
    ) => JSX.Element | null;
}

const PropertyTimestampsCard: React.FC<PropertyTimestampsCardProps> = ({
    propertyData,
    renderDetailItem,
}) => {
    return (
        <div className={getBaseCardClasses()}>
            <div className="p-4 border-b border-gray-200"><h3 className="text-base font-semibold text-gray-800">Timestamps</h3></div>
            <dl className="p-4 space-y-2">
                {renderDetailItem("Submitted On", propertyData.submitted_at, <IconCalendar size={14} />, undefined, true, true)}
                {renderDetailItem("Created At", propertyData.created_at, <IconCalendar size={14} />, undefined, true, true)}
                {renderDetailItem("Last Updated At", propertyData.updated_at, <IconCalendar size={14} />, undefined, true, true)}
            </dl>
        </div>
    );
};

export default PropertyTimestampsCard;