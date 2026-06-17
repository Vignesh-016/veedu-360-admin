import { useState, Fragment, useEffect, useCallback, useRef, useMemo } from 'react';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions, Transition } from '@headlessui/react';
import { IconSelector, IconCheck, IconX } from '@tabler/icons-react';
import LoadingSpinner from './LoadingSpinner';
import { getBaseInputClasses } from '../lib/twUtils';

function debounce<F extends (...args: any[]) => void>(func: F, waitFor: number) {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<F>): void => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            timeoutId = null;
            func(...args);
        }, waitFor);
    };
}


interface SearchableSelectOption {
    value: string | number;
    label: string;
}

interface SearchableSelectProps<T extends SearchableSelectOption> {
    label: string;
    value: string | number | undefined;
    onChange: (value: string | number | undefined) => void;
    fetchOptions: (query: string) => Promise<T[]>;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
    initialDisplayValue?: string;
}

function SearchableSelect<T extends SearchableSelectOption>(
    { label, value, onChange, fetchOptions, placeholder, required, disabled, icon, initialDisplayValue }: SearchableSelectProps<T>
) {
    const [query, setQuery] = useState('');
    const [options, setOptions] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(false);

    const [manuallySelectedItem, setManuallySelectedItem] = useState<T | null>(null);

    useEffect(() => {
        if (manuallySelectedItem && manuallySelectedItem.value !== value) {
            setManuallySelectedItem(null);
        }
    }, [value, manuallySelectedItem]);

    const selectedOption = useMemo(() => {
        if (value === undefined || value === null) return null;

        // Priority 1: Use the item just selected by the user, if it's still relevant.
        if (manuallySelectedItem && manuallySelectedItem.value === value) {
            return manuallySelectedItem;
        }

        // Priority 2: Find the item in the current dropdown search results.
        const foundInCurrentOptions = options.find(opt => opt.value === value);
        if (foundInCurrentOptions) {
            return foundInCurrentOptions;
        }

        // Priority 3: Fallback to the initial display value from props, used for initial form loads.
        if (initialDisplayValue) {
            return { value, label: initialDisplayValue } as T;
        }

        return null;
    }, [value, options, initialDisplayValue, manuallySelectedItem]);


    const debouncedFetch = useCallback(
        debounce(async (currentQuery: string) => {
            if (currentQuery.length === 0 && isMounted.current) {
                setOptions([]);
                setLoading(false);
                return;
            }

            if (currentQuery.length === 0 && !isMounted.current) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const fetched = await fetchOptions(currentQuery);
                setOptions(fetched);
            } catch (err) {
                console.error("Error fetching options:", err);
                setError("Failed to load options");
                setOptions([]);
            } finally {
                setLoading(false);
                if (!isMounted.current) {
                    isMounted.current = true;
                }
            }
        }, 1000),
        [fetchOptions]
    );

    useEffect(() => {
        if (query.length > 0 || !isMounted.current) {
            debouncedFetch(query);
        } else {
            setOptions([]);
        }
    }, [query, debouncedFetch]);


    const handleSelectionChange = (option: T | null) => {
        onChange(option?.value);
        setManuallySelectedItem(option);
        setOptions([]);
        setQuery('');
    };

    const clearSelection = () => {
        onChange(undefined);
        setManuallySelectedItem(null);
    }

    const displayValueFn = (option: T | null): string => {
        return option?.label ?? '';
    };

    return (
        <div className="w-full">
            <Combobox value={selectedOption} onChange={handleSelectionChange} disabled={disabled} nullable>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                <div className="relative mt-1">
                    {icon && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 z-10">
                            {icon}
                        </div>
                    )}

                    <ComboboxInput
                        className={`${icon ? 'pl-10' : ''} ${getBaseInputClasses({ "hasError": !!error })} pr-12`}
                        displayValue={displayValueFn}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={placeholder}
                        aria-label={label}
                        autoComplete="off"
                    />

                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                        {!loading && selectedOption && !disabled && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    clearSelection();
                                }}
                                className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer focus:outline-none"
                                title="Clear selection"
                                aria-label="Clear selection"
                            >
                                <IconX size={14} aria-hidden="true" />
                            </button>
                        )}
                        {loading && <LoadingSpinner size={16} className="mx-1 text-gray-500" />}
                        <ComboboxButton className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none">
                            {!loading && <IconSelector className="h-5 w-5" aria-hidden="true" />}
                        </ComboboxButton>
                    </div>

                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <ComboboxOptions className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                            {error && <div className="relative cursor-default select-none py-2 px-4 text-red-700 italic">{error}</div>}
                            {!loading && !error && options.length === 0 && query !== '' && (
                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                    Nothing found.
                                </div>
                            )}
                            {!loading && !error && options.length === 0 && query === '' && !selectedOption && isMounted.current && (
                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700 italic">
                                    Start typing to search...
                                </div>
                            )}
                            {!loading && !error && options.map((option) => (
                                <ComboboxOption
                                    key={option.value}
                                    className={({ active }) =>
                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-[#D9A619] text-white' : 'text-gray-900'}`
                                    }
                                    value={option}
                                >
                                    {({ selected, active }) => (
                                        <>
                                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                {option.label}
                                            </span>
                                            {selected ? (
                                                <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-[#D9A619]'}`}>
                                                    <IconCheck className="h-5 w-5" aria-hidden="true" />
                                                </span>
                                            ) : null}
                                        </>
                                    )}
                                </ComboboxOption>
                            ))}
                        </ComboboxOptions>
                    </Transition>
                </div>
            </Combobox>
        </div>
    );
}

export default SearchableSelect;