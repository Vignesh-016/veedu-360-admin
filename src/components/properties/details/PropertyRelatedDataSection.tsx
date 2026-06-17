import { Fragment, JSX } from 'react';
import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react';
import { IconEye } from '@tabler/icons-react';
import { getBaseCardClasses } from '../../../lib/twUtils';

interface PropertyRelatedDataSectionProps<T> {
    title: string;
    icon: React.ReactNode;
    data: T[] | undefined;
    itemRenderer: (item: T) => JSX.Element;
    emptyMessage?: string;
    defaultOpen?: boolean;
}

function PropertyRelatedDataSection<T>({
    title,
    icon,
    data,
    itemRenderer,
    emptyMessage = "No items found.",
    defaultOpen = true,
}: PropertyRelatedDataSectionProps<T>) {
    if (!data) return null;

    return (
        <Disclosure as="div" className={`${getBaseCardClasses()} overflow-hidden`} defaultOpen={defaultOpen && data.length > 0}>
            {({ open }) => (
                <>
                    <DisclosureButton className="flex justify-between w-full px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-gray-500 focus-visible:ring-opacity-75 transition-colors">
                        <span className="flex items-center font-semibold">{icon}<span className='ml-2'>{title} ({data.length})</span></span>
                        <IconEye className={`${open ? '' : 'transform rotate-180'} w-5 h-5 text-gray-400 transition-transform`} />
                    </DisclosureButton>
                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                    >
                        <DisclosurePanel className="text-sm text-gray-500 border-t border-gray-100">
                            {data.length > 0 ? (
                                <ul className="p-4 space-y-2 max-h-80 overflow-y-auto">
                                    {data.map(itemRenderer)}
                                </ul>
                            ) : (
                                <p className="p-4 italic text-gray-400">{emptyMessage}</p>
                            )}
                        </DisclosurePanel>
                    </Transition>
                </>
            )}
        </Disclosure>
    );
}

export default PropertyRelatedDataSection;