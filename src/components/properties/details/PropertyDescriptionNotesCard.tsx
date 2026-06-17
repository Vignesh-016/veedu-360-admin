import { IconListDetails, IconNote } from '@tabler/icons-react';
import { getBaseCardClasses } from '../../../lib/twUtils';
import { FullPropertyDetailsAdminData } from '../../../lib/reports/propertyType';
import { JSX } from 'react';

interface PropertyDescriptionNotesCardProps {
    propertyData: FullPropertyDetailsAdminData;
    renderDetailItem: (
        label: string,
        value: React.ReactNode | string | number | boolean | null | undefined,
        icon?: React.ReactNode,
    ) => JSX.Element | null;
}

const PropertyDescriptionNotesCard: React.FC<PropertyDescriptionNotesCardProps> = ({
    propertyData,
    renderDetailItem,
}) => {
    return (
        <div className={getBaseCardClasses()}>
            <div className="p-5 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-800">Descriptions & Notes</h2></div>
            <div className="p-5 space-y-4">
                {renderDetailItem("Public Description", <p className="text-sm text-gray-800 whitespace-pre-line">{propertyData.description || <span className='italic text-gray-400'>N/A</span>}</p>, <IconListDetails size={16} />)}
                {renderDetailItem("Submitter Notes", <p className="text-sm text-gray-800 whitespace-pre-line">{propertyData.submitter_notes || <span className='italic text-gray-400'>N/A</span>}</p>, <IconNote size={16} />)}
                {renderDetailItem("Admin Notes", <p className="text-sm text-gray-800 whitespace-pre-line">{propertyData.admin_notes || <span className='italic text-gray-400'>N/A</span>}</p>, <IconNote size={16} />)}
            </div>
        </div>
    );
};

export default PropertyDescriptionNotesCard;