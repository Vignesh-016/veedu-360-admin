import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useState, useCallback, ChangeEvent } from 'react';
import { IconX, IconPlus, IconTrash, IconKey, IconFileText, IconAlertCircle, IconTag } from '@tabler/icons-react';
import { getBaseInputClasses, getPrimaryButtonClasses, getSecondaryButtonClasses } from '../lib/twUtils';
import LoadingSpinner from './LoadingSpinner';
import { Json } from '../database.types';

interface KeyValueRow {
    id: string;
    key: string;
    value: string;
}

interface JsonEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialJson: Json | null | undefined;
    onSave: (updatedJson: Json) => void;
    title: string;
    keyPlaceholder?: string;
    valuePlaceholder?: string;
    predefinedKeys?: string[];
}

interface JsonEditorModalBodyProps extends Omit<JsonEditorModalProps, 'isOpen'> { }

function JsonEditorModalBody({
    onClose,
    initialJson,
    onSave,
    title,
    keyPlaceholder = "Attribute Name",
    valuePlaceholder = "Value",
    predefinedKeys = []
}: JsonEditorModalBodyProps) {

    const jsonToRows = useCallback((jsonObj: Json | null | undefined): KeyValueRow[] => {
        if (!jsonObj || typeof jsonObj !== 'object' || Array.isArray(jsonObj)) {
            return [];
        }
        return Object.entries(jsonObj)
            .filter(([, value]) => typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
            .map(([key, value]) => ({
                id: Math.random().toString(36).substring(2, 9),
                key: key,
                value: String(value),
            }));
    }, []);

    const [jsonData, setJsonData] = useState<KeyValueRow[]>(() => jsonToRows(initialJson));
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const rowsToJson = (rows: KeyValueRow[]): Json => {
        const jsonObj: { [key: string]: string } = {};
        let hasError = false;
        setError(null);

        rows.forEach(row => {
            const trimmedKey = row.key.trim();
            if (trimmedKey) {
                if (jsonObj.hasOwnProperty(trimmedKey)) {
                    setError(`Duplicate key found: "${trimmedKey}". Please use unique keys.`);
                    hasError = true;
                }
                jsonObj[trimmedKey] = row.value;
            } else if (row.value.trim()) {
                setError("Found an entry with a value but no key. It will not be saved.");
            }
        });

        if (hasError) {
            throw new Error("Validation failed during JSON conversion due to duplicate keys.");
        }
        return jsonObj;
    };

    const handleAddRow = (key: string = '', value: string = '') => {
        setJsonData(prev => [
            ...prev,
            { id: Math.random().toString(36).substring(2, 9), key, value }
        ]);
    };

    const handleDeleteRow = (id: string) => {
        setJsonData(prev => prev.filter(row => row.id !== id));
    };

    const handleInputChange = (id: string, field: 'key' | 'value', newValue: string) => {
        setJsonData(prev =>
            prev.map(row => (row.id === id ? { ...row, [field]: newValue } : row))
        );
    };

    const handleSaveChanges = () => {
        setLoading(true);
        setError(null);
        try {
            const updatedJson = rowsToJson(jsonData);
            onSave(updatedJson);
            onClose();
        } catch (err: any) {
            if (!error) {
                setError(err.message || "An unexpected error occurred while saving.");
            }
            console.error("Error saving JSON:", err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900">{title}</h2>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
                    aria-label="Close modal"
                >
                    <IconX className="h-5 w-5" />
                </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                {predefinedKeys && predefinedKeys.length > 0 && (
                    <div className="mb-4 pb-3 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Quick Add Attribute</p>
                        <div className="flex flex-wrap gap-2">
                            {predefinedKeys.map((key) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => handleAddRow(key, '')}
                                    className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-full hover:bg-indigo-200 transition-colors flex items-center shadow-sm hover:shadow-md"
                                    title={`Add attribute: ${key}`}
                                >
                                    <IconTag size={14} className="mr-1.5 text-indigo-500" />
                                    {key}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-700 flex items-center">
                            <IconAlertCircle className="w-4 h-4 mr-2 text-red-500 flex-shrink-0" />
                            {error}
                        </p>
                    </div>
                )}

                {jsonData.length === 0 && !error && (
                    <p className="text-sm text-gray-500 italic text-center py-4">
                        {predefinedKeys.length > 0
                            ? 'No details added yet. Click a "Quick Add" chip or "Add Row" to start.'
                            : 'No details added yet. Click "Add Row" to start.'
                        }
                    </p>
                )}

                {jsonData.map((row) => (
                    <div key={row.id} className="flex items-center space-x-2 group">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500">
                                <IconKey size={16} />
                            </div>
                            <input
                                type="text"
                                value={row.key}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(row.id, 'key', e.target.value)}
                                placeholder={keyPlaceholder}
                                className={`pl-10 ${getBaseInputClasses()}`}
                            />
                        </div>
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500">
                                <IconFileText size={16} />
                            </div>
                            <input
                                type="text"
                                value={row.value}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(row.id, 'value', e.target.value)}
                                placeholder={valuePlaceholder}
                                className={`pl-10 ${getBaseInputClasses()}`}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => handleDeleteRow(row.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors opacity-50 group-hover:opacity-100"
                            title="Delete Row"
                        >
                            <IconTrash size={18} />
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={() => handleAddRow()}
                    className={`mt-3 ${getSecondaryButtonClasses()} w-full justify-center`}
                >
                    <IconPlus size={16} className="mr-1" /> Add Custom Row
                </button>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end bg-gray-50 space-x-3">
                <button type="button" onClick={onClose} className={getSecondaryButtonClasses()} disabled={loading}>
                    Cancel
                </button>
                <button type="button" onClick={handleSaveChanges} className={getPrimaryButtonClasses()} disabled={loading || !!error}>
                    {loading && <LoadingSpinner size={16} className="mr-1.5 -ml-1" />}
                    {loading ? 'Saving...' : 'Save Details'}
                </button>
            </div>
        </>
    );
}

function JsonEditorModal({
    isOpen,
    onClose,
    initialJson,
    onSave,
    title,
    keyPlaceholder = "Attribute Name",
    valuePlaceholder = "Value",
    predefinedKeys = []
}: JsonEditorModalProps) {
    const modalKey = JSON.stringify(initialJson);

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-20" onClose={onClose}>
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                </TransitionChild>

                <div className="fixed inset-0 z-20 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                                {isOpen && (
                                    <JsonEditorModalBody
                                        key={modalKey}
                                        onClose={onClose}
                                        initialJson={initialJson}
                                        onSave={onSave}
                                        title={title}
                                        keyPlaceholder={keyPlaceholder}
                                        valuePlaceholder={valuePlaceholder}
                                        predefinedKeys={predefinedKeys}
                                    />
                                )}
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

export default JsonEditorModal;