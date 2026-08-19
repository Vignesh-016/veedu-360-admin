import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useState, useCallback, ChangeEvent, FormEvent, useEffect } from 'react';
import {
    IconX, IconHome, IconMapPin, IconCoinRupee, IconRuler, IconBuildingHospital,
    IconBus, IconNotes, IconBuilding, IconRoad, IconDimensions, IconBarbell, IconSwimming,
    IconSchool, IconFountain, IconLocation, IconCalendar, IconTag, IconCheckbox, IconListDetails,
    IconBed, IconCompass, IconArmchair, IconBuildingCommunity, IconLayoutGrid, IconHomeCheck, IconMapSearch,
    IconNumber, IconWorldLatitude, IconWorldLongitude, IconMap, IconBuildingWarehouse, IconToolsKitchen2,
    IconAlertCircle, IconSparkles, IconUser, IconCertificate, IconEdit, IconVideo, IconUserQuestion,
    IconHandGrab, IconCircleCheck, IconUserShield, IconElevator
} from '@tabler/icons-react';
import { Switch } from '@headlessui/react';
import {
    AreaUnit, ListingType, AdminPropertyDetails, PropertyType, ProximityUnit, HouseType,
    FurnishedStatus, Direction, LandType, BuildingType, HouseDetailsJson,
    LandDetailsJson, BuildingDetailsJson, WaterSource, PowerBackup, ManagementPlanInfo, PropertyAdminStatus,
    SubmitterType, AvailabilityStatus, UpdatePropertyAdminParams, InsertPropertyAdminParams
} from '../lib/types';
import * as displayUtils from '../lib/displayUtils';
import api from '../lib/supabaseClient';
import { useNotification } from './NotificationProvider';
import LoadingSpinner from './LoadingSpinner';
import JsonEditorModal from './JsonEditorModal';
import { getBaseInputClasses, getPrimaryButtonClasses, getSecondaryButtonClasses } from '../lib/twUtils';
import MapEditor from './MapEditor';
import SearchableSelect from './SearchableSelect';
import { Json } from '../database.types';

const defaultHouseDetails: HouseDetailsJson = {
    house_name: '',
    house_type: 'APARTMENT_FLAT', num_bedrooms: 0, num_bathrooms: 0, num_balconies: 0,
    total_floors: 1, floor_number: 1, num_carparking: 0, furnished_status: 'UNFURNISHED',
    facing_direction: 'NORTH', is_corner_plot: false, water_source: 'MUNICIPAL', power_backup: 'NONE',
    lift_facility_available: false
};
const defaultLandDetails: LandDetailsJson = {
    land_name: '',
    land_type: 'RESIDENTIAL', plot_dimensions: '', road_access_width_ft: 0,
    is_corner_plot: false, is_dtcp_approved: false
};
const defaultBuildingDetails: BuildingDetailsJson = {
    building_name: '',
    building_type: 'OFFICE', total_floors: 1, num_units: 1, available_units: 1, common_amenities: [],
};

interface PropertyFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    property?: AdminPropertyDetails | null;
    onSuccess: () => void;
}

interface PropertyFormBodyProps extends PropertyFormModalProps {
    managementPlans: ManagementPlanInfo[];
    managementPlansLoading: boolean;
}

type DetailsState = HouseDetailsJson | LandDetailsJson | BuildingDetailsJson | {};

function PropertyFormModalBody({
    property,
    onClose,
    onSuccess,
    managementPlans,
    managementPlansLoading
}: PropertyFormBodyProps) {
    const { showSuccessNotification, showErrorNotification } = useNotification();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isJsonEditorOpen, setIsJsonEditorOpen] = useState(false);

    const isEditing = !!property;

    // --- Core Property Info ---
    const [propertyType, setPropertyType] = useState<PropertyType>(property?.property_type || 'HOUSE');
    const [listingType, setListingType] = useState<ListingType>(property?.listing_type || 'RENTAL');
    const [price, setPrice] = useState<number>(property?.price || 0);
    const [advanceAmount, setAdvanceAmount] = useState<number | undefined>(property?.advance_amount ?? undefined);
    const [area, setArea] = useState<number | undefined>(property?.area ?? undefined);
    const [areaUnit, setAreaUnit] = useState<AreaUnit | undefined>(property?.area_unit ?? undefined);
    const [description, setDescription] = useState<string | undefined>(property?.description ?? undefined);
    const [locality, setLocality] = useState<string>(property?.locality || '');
    const [city, setCity] = useState<string>(property?.city || '');
    const [address, setAddress] = useState<string>(property?.address || '');
    const [pincode, setPincode] = useState<number>(property?.pincode ?? 0);
    const [youtubeUrl, setYoutubeUrl] = useState<string | undefined>(property?.youtube_url ?? undefined);
    const [latitude, setLatitude] = useState<number | undefined>(property?.latitude ?? undefined);
    const [longitude, setLongitude] = useState<number | undefined>(property?.longitude ?? undefined);
    const [yearBuilt, setYearBuilt] = useState<number | undefined>(property?.year_built ?? undefined);

    // --- Admin Status & Listing Flags ---
    const [adminStatus, setAdminStatus] = useState<PropertyAdminStatus>(property?.admin_status || 'SUBMITTED');
    const [adminNotes, setAdminNotes] = useState<string | undefined>(property?.admin_notes ?? undefined);
    const [submitterNotes, setSubmitterNotes] = useState<string | undefined>(property?.submitter_notes ?? undefined);
    const [submitterType, setSubmitterType] = useState<SubmitterType | undefined>(property?.submitter_type ?? undefined);
    const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus | undefined>(property?.availability_status ?? undefined);
    const [canReachOut] = useState<boolean>(property?.can_reachout ?? true);
    const [isExclusive, setIsExclusive] = useState<boolean>(property?.is_exclusive ?? false);
    const [isFeatured, setIsFeatured] = useState<boolean>(property?.is_featured ?? false);

    // --- User Links ---
    const [submitterId, setSubmitterId] = useState<string | undefined>(property?.submitter_info?.user_id ?? undefined);
    const [tenantId, setTenantId] = useState<string | undefined>(property?.tenant_info?.user_id ?? undefined);
    const [initialSubmitterName] = useState<string | undefined>(property?.submitter_info?.name ?? undefined);
    const [initialTenantName] = useState<string | undefined>(property?.tenant_info?.name ?? undefined);

    const [managementPlanId, setManagementPlanId] = useState<string | undefined>(property?.management_plan_info?.plan_id ?? undefined);
    const [rentDueDay, setRentDueDay] = useState<number | undefined>(property?.rent_due_day ?? undefined);

    // --- Nearby Amenities ---
    const [nearestHospital, setNearestHospital] = useState<number | undefined>(property?.nearest_hospital ?? undefined);
    const [nearestBusstop, setNearestBusstop] = useState<number | undefined>(property?.nearest_busstop ?? undefined);
    const [nearestGym, setNearestGym] = useState<number | undefined>(property?.nearest_gym ?? undefined);
    const [nearestPark, setNearestPark] = useState<number | undefined>(property?.nearest_park ?? undefined);
    const [nearestSchool, setNearestSchool] = useState<number | undefined>(property?.nearest_school ?? undefined);
    const [nearestSwimmingpool, setNearestSwimmingpool] = useState<number | undefined>(property?.nearest_swimmingpool ?? undefined);
    const [proximityUnit, setProximityUnit] = useState<ProximityUnit | undefined>(property?.proximity_unit ?? undefined);

    // --- Type Specific & Inventory Details ---
    const [detailsState, setDetailsState] = useState<DetailsState>(() => {
        const existingDetails = (typeof property?.details === 'object' && property.details !== null && !Array.isArray(property.details))
            ? property.details : {};
        switch (property?.property_type) {
            case 'HOUSE': return { ...defaultHouseDetails, ...existingDetails };
            case 'LAND': return { ...defaultLandDetails, ...existingDetails };
            case 'BUILDING': return { ...defaultBuildingDetails, ...existingDetails };
            default: return defaultHouseDetails; // Default for new property
        }
    });
    const [inventoryDetailsState, setInventoryDetailsState] = useState<Json>(property?.inventory_details || {});

    const handlePropertyTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value as PropertyType;
        setPropertyType(newType);
        if (newType === 'LAND') {
            setAvailabilityStatus('READY_TO_MOVE');
        }

        switch (newType) {
            case 'HOUSE': setDetailsState(defaultHouseDetails); break;
            case 'LAND': setDetailsState(defaultLandDetails); break;
            case 'BUILDING': setDetailsState(defaultBuildingDetails); break;
            default: setDetailsState({});
        }
    };

    const updateDetails = useCallback((field: string, value: any) => {
        setDetailsState(prev => ({ ...prev, [field]: value }));
    }, []);

    const parseNumberInput = (value: string): number => Number(value) || 0;
    const parseNullableNumberInput = (value: string): number | undefined => value === '' ? undefined : Number(value) || undefined;
    const parseNullableFloatInput = (value: string): number | undefined => value === '' ? undefined : parseFloat(value) || undefined;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validate mandatory details name based on property type
        if (propertyType === 'HOUSE' && isHouseDetails(detailsState) && !detailsState.house_name?.trim()) {
            setError("House Name is required for House type properties."); setLoading(false); return;
        }
        if (propertyType === 'LAND' && isLandDetails(detailsState) && !detailsState.land_name?.trim()) {
            setError("Land Name is required for Land type properties."); setLoading(false); return;
        }
        if (propertyType === 'BUILDING' && isBuildingDetails(detailsState) && !detailsState.building_name?.trim()) {
            setError("Building Name is required for Building type properties."); setLoading(false); return;
        }

        const detailsToSend: Json = (typeof detailsState === 'object' && detailsState !== null && !Array.isArray(detailsState)) ? detailsState as Json : {};
        const inventoryDetailsToSend: Json = (typeof inventoryDetailsState === 'object' && inventoryDetailsState !== null && !Array.isArray(inventoryDetailsState)) ? inventoryDetailsState as Json : {};

        let finalRentDueDay: number | undefined | null = undefined;
        if (listingType === 'RENTAL' && rentDueDay !== undefined && rentDueDay !== null) {
            if (rentDueDay < 1 || rentDueDay > 28) {
                setError("Rent Due Day must be between 1 and 28."); setLoading(false); return;
            }
            finalRentDueDay = rentDueDay;
        }
        try {
            if (isEditing && property) {
                const updateParams: UpdatePropertyAdminParams = {
                    p_property_id: property.property_id, p_property_type: propertyType, p_listing_type: listingType, p_price: price,
                    p_advance_amount: advanceAmount, p_area: area ?? null as any, p_area_unit: area ? (areaUnit ?? null as any) : null as any, p_description: description, p_locality: locality,
                    p_city: city, p_address: address, p_pincode: pincode, p_youtube_url: youtubeUrl, p_latitude: latitude, p_longitude: longitude,
                    p_year_built: propertyType === 'LAND' ? undefined : parseNullableNumberInput(yearBuilt?.toString() ?? ''), p_nearest_hospital: parseNullableNumberInput(nearestHospital?.toString() ?? ''),
                    p_nearest_busstop: parseNullableNumberInput(nearestBusstop?.toString() ?? ''), p_nearest_gym: parseNullableNumberInput(nearestGym?.toString() ?? ''),
                    p_nearest_park: parseNullableNumberInput(nearestPark?.toString() ?? ''), p_nearest_school: parseNullableNumberInput(nearestSchool?.toString() ?? ''),
                    p_nearest_swimmingpool: parseNullableNumberInput(nearestSwimmingpool?.toString() ?? ''), p_proximity_unit: proximityUnit,
                    p_details: detailsToSend, p_inventory_details: inventoryDetailsToSend, p_admin_status: adminStatus, p_admin_notes: adminNotes,
                    p_submitter_notes: submitterNotes, p_submitter: submitterId, p_tenant: tenantId, p_submitter_type: submitterType,
                    p_availability_status: availabilityStatus, p_can_reachout: canReachOut, p_is_exclusive: isExclusive, p_is_featured: isFeatured,
                    p_management_plan_id: managementPlanId, p_rent_due_day: finalRentDueDay,
                };
                const { error: updateError } = await api.updatePropertyAdmin(updateParams);
                if (updateError) throw updateError;
                showSuccessNotification("Property Updated", "Property updated successfully!");
            } else {
                const insertParams: InsertPropertyAdminParams = {
                    p_property_type: propertyType, p_listing_type: listingType, p_price: price, p_advance_amount: advanceAmount, p_area: area ?? null as any,
                    p_area_unit: area ? (areaUnit ?? null as any) : null as any, p_description: description, p_locality: locality, p_city: city, p_address: address, p_pincode: pincode,
                    p_details: detailsToSend, p_inventory_details: inventoryDetailsToSend, p_youtube_url: youtubeUrl, p_latitude: latitude,
                    p_longitude: longitude, p_year_built: yearBuilt, p_nearest_hospital: nearestHospital, p_nearest_busstop: nearestBusstop,
                    p_nearest_gym: nearestGym, p_nearest_park: nearestPark, p_nearest_school: nearestSchool,
                    p_nearest_swimmingpool: nearestSwimmingpool, p_proximity_unit: proximityUnit, p_admin_status: adminStatus,
                    p_admin_notes: adminNotes, p_submitter_notes: submitterNotes, p_submitter: submitterId, p_tenant: tenantId,
                    p_submitter_type: submitterType, p_availability_status: availabilityStatus, p_can_reachout: canReachOut,
                    p_is_exclusive: isExclusive, p_is_featured: isFeatured, p_management_plan_id: managementPlanId, p_rent_due_day: finalRentDueDay,
                };
                const { data: newPropertyId, error: insertError } = await api.insertPropertyAdmin(insertParams);
                if (insertError) throw insertError;
                if (!newPropertyId) throw new Error("Failed to get new property ID after insertion.");
                showSuccessNotification("Property Added", `Property added successfully! ID: ${newPropertyId}`);
            }
            onSuccess();
            onClose();
        } catch (submitError: any) {
            console.error('Error submitting property:', submitError);
            const message = submitError?.message || submitError?.details || 'An unexpected error occurred.';
            setError(`Failed to save property: ${message}`);
            showErrorNotification("Error saving property", message);
        } finally {
            setLoading(false);
        }
    };

    const renderInputWithIcon = (
        id: string, label: string, type: string, value: string | number | null | undefined,
        onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void,
        icon: React.ReactNode, placeholder?: string, min?: number | string, step?: number | string,
        required: boolean = false, rows?: number
    ) => (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label} {required && <span className="text-red-500">*</span>}</label>
            <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">{icon}</div>
                {type === 'textarea' ? (<textarea id={id} value={value ?? ''} onChange={onChange} rows={rows || 3} className={`pl-10 ${getBaseInputClasses()}`} placeholder={placeholder} required={required} disabled={loading} />)
                    : (<input type={type} id={id} value={value ?? ''} onChange={onChange} className={`pl-10 ${getBaseInputClasses()}`} placeholder={placeholder} min={min} step={step} required={required} disabled={loading} />)}
            </div>
        </div>
    );

    const renderSelectWithIcon = (
        id: string, label: string, value: string | number | boolean | undefined,
        onChange: (e: ChangeEvent<HTMLSelectElement>) => void,
        icon: React.ReactNode, options: { value: string | number | boolean | ''; label: string }[],
        required: boolean = false, isLoading: boolean = false
    ) => (
        <div className="relative">
            <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label} {required && <span className="text-red-500">*</span>}</label>
            <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">{icon}</div>
                <select id={id} value={value?.toString() ?? ''} onChange={onChange} className={`pl-10 ${getBaseInputClasses()}`} required={required} disabled={loading || isLoading} >
                    {options.map(option => (<option key={option.label} value={option.value.toString()}>{option.label}</option>))}
                </select>
                {isLoading && <LoadingSpinner size={16} className="absolute right-2 top-1/2 -translate-y-1/2 mt-0.5" />}
            </div>
        </div>
    );

    const propertyTypeOptions = Object.entries(displayUtils.propertyTypeMap).map(([value, label]) => ({ value, label }));
    const listingTypeOptions = Object.entries(displayUtils.listingTypeMap).map(([value, label]) => ({ value, label }));
    const areaUnitOptions = [
        { value: '', label: 'Select Area Unit' },
        ...Object.entries(displayUtils.areaUnitMap).map(([value, label]) => ({ value, label }))
    ];
    const carParkingOptions = [
        { value: '', label: 'Select Parking Option' },
        { value: 'COVERED', label: 'Covered' },
        { value: 'AMPLE', label: 'Ample' },
        { value: 'OPEN', label: 'Open' }
    ];
    const availabilityStatusOptions = Object.entries(displayUtils.availabilityStatusMap)
        .filter(([value]) => !(propertyType === 'LAND' && value === 'UNDER_CONSTRUCTION'))
        .map(([value, label]) => ({ value, label }));
    const houseTypeOptions = Object.entries(displayUtils.houseTypeMap).map(([value, label]) => ({ value, label }));
    const furnishedStatusOptions = Object.entries(displayUtils.furnishedStatusMap).map(([value, label]) => ({ value, label }));
    const directionOptions = Object.entries(displayUtils.directionMap).map(([value, label]) => ({ value, label }));
    const landTypeOptions = Object.entries(displayUtils.landTypeMap).map(([value, label]) => ({ value, label }));
    const buildingTypeOptions = Object.entries(displayUtils.buildingTypeMap).map(([value, label]) => ({ value, label }));
    const proximityUnitOptions = [{ value: '', label: 'Select Unit' }, ...Object.entries(displayUtils.proximityUnitMap).map(([value, label]) => ({ value, label }))];
    const waterSourceOptions = Object.entries(displayUtils.waterSourceMap).map(([value, label]) => ({ value, label }));
    const powerBackupOptions = Object.entries(displayUtils.powerBackupMap).map(([value, label]) => ({ value, label }));
    const booleanOptions = [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }];
    const managementPlanOptions = [{ value: '', label: 'None' }, ...managementPlans.map(p => ({ value: p.plan_id, label: `${p.name} (${p.percentage}%)` }))];
    const propertyAdminStatusOptions = Object.entries(displayUtils.propertyAdminStatusMap).map(([value, label]) => ({ value, label }));
    const submitterTypeOptions = Object.entries(displayUtils.submitterTypeMap).map(([value, label]) => ({ value, label }));


    const isHouseDetails = (details: DetailsState): details is HouseDetailsJson => 'house_name' in details && details !== null;
    const isLandDetails = (details: DetailsState): details is LandDetailsJson => 'land_name' in details && details !== null;
    const isBuildingDetails = (details: DetailsState): details is BuildingDetailsJson => 'building_name' in details && details !== null;

    const fetchUserOptions = async (query: string): Promise<{ value: string; label: string }[]> => {
        const { data, error: userError } = await api.searchCustomers(query, undefined, 0, 20);
        if (userError || !data) { console.error("Error fetching users:", userError); showErrorNotification("User Search Error", "Could not load users."); return []; }
        return (data || []).map((user) => ({ value: user.user_id, label: `${user.full_name ?? 'N/A'} (${user.email ?? 'No Email'})` }));
    };

    return (
        <>
            <form onSubmit={handleSubmit}>
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50"><h2 className="text-lg font-medium text-gray-900">{isEditing ? 'Edit Property' : 'Add New Property'}</h2><button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500"><IconX className="h-5 w-5" /></button></div>
                <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
                    {error && (<div className="p-3 bg-red-50 border border-red-200 rounded-md"><p className="text-sm text-red-700 flex items-center"><IconAlertCircle className="w-4 h-4 mr-2 text-red-500" />{error}</p></div>)}
                    <fieldset className="border border-gray-200 p-4 rounded-md">
                        <legend className="text-base font-medium text-gray-900 px-2">Core Information</legend>
                        <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-6">
                            {renderSelectWithIcon("propertyType", "Property Type", propertyType, handlePropertyTypeChange, <IconBuildingCommunity className="h-4 w-4" />, propertyTypeOptions, true)}
                            {renderSelectWithIcon("listingType", "Listing Type", listingType, (e) => setListingType(e.target.value as ListingType), <IconTag className="h-4 w-4" />, listingTypeOptions, true)}
                            {renderInputWithIcon("price", "Price (INR)", "number", price, (e) => setPrice(parseNumberInput(e.target.value)), <IconCoinRupee className="h-4 w-4" />, "0", 0, "0.01", true)}
                            {renderInputWithIcon("advanceAmount", "Advance Amount (INR)", "number", advanceAmount, (e) => setAdvanceAmount(parseNullableNumberInput(e.target.value)), <IconCoinRupee className="h-4 w-4" />, "Optional", 0, "0.01", false)}
                            {renderInputWithIcon("area", "Area", "number", area, (e) => setArea(parseNullableNumberInput(e.target.value)), <IconRuler className="h-4 w-4" />, "Optional", 0, "0.01", false)}
                            {renderSelectWithIcon("areaUnit", "Area Unit", areaUnit || '', (e) => setAreaUnit(e.target.value as AreaUnit || undefined), <IconDimensions className="h-4 w-4" />, areaUnitOptions, false)}
                            {renderSelectWithIcon("adminStatus", "Admin Status", adminStatus, (e) => setAdminStatus(e.target.value as PropertyAdminStatus), <IconCircleCheck className="h-4 w-4" />, propertyAdminStatusOptions, true)}
                        </div>
                    </fieldset>
                    <fieldset className="border border-gray-200 p-4 rounded-md">
                        <legend className="text-base font-medium text-gray-900 px-2">Ownership & Management</legend>
                        <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-6">
                            <SearchableSelect label="Submitter (Owner)" value={submitterId} onChange={(value) => setSubmitterId(value as string | undefined)} fetchOptions={fetchUserOptions} placeholder="Search Submitter..." icon={<IconUserShield size={16} />} disabled={loading} initialDisplayValue={initialSubmitterName} />
                            <SearchableSelect label="Tenant (Occupied By)" value={tenantId} onChange={(value) => setTenantId(value as string | undefined)} fetchOptions={fetchUserOptions} placeholder="Search Tenant..." icon={<IconUser size={16} />} disabled={loading} initialDisplayValue={initialTenantName} />
                            {renderSelectWithIcon("managementPlanId", "Management Plan", managementPlanId, (e) => setManagementPlanId(e.target.value || undefined), <IconCertificate className="h-4 w-4" />, managementPlanOptions, false, managementPlansLoading)}
                            {renderSelectWithIcon("submitterType", "Submitter Type", submitterType, (e) => setSubmitterType(e.target.value as SubmitterType || undefined), <IconUserQuestion className="h-4 w-4" />, submitterTypeOptions)}
                        </div>
                    </fieldset>
                    <fieldset className="border border-gray-200 p-4 rounded-md">
                        <legend className="text-base font-medium text-gray-900 px-2">Location Details</legend>
                        <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-6">
                            {renderInputWithIcon("locality", "Locality / Area Name", "text", locality, (e) => setLocality(e.target.value), <IconMap className="h-4 w-4" />, "e.g., Vannarpettai", 0, undefined, true)}
                            {renderInputWithIcon("city", "City", "text", city, (e) => setCity(e.target.value), <IconMapPin className="h-4 w-4" />, "e.g., Tirunelveli", 0, undefined, true)}
                            {renderInputWithIcon("pincode", "Pincode", "number", pincode, (e) => setPincode(parseNullableNumberInput(e.target.value) || 0), <IconMapPin className="h-4 w-4" />, "e.g., 627003", 100000, undefined, true)}
                            {renderInputWithIcon("address", "Full Address", "textarea", address, (e) => setAddress(e.target.value), <IconLocation className="h-4 w-4" />, "Enter complete address", undefined, undefined, true, 3)}
                        </div>
                        <div className="mt-4">
                            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center"><IconMapSearch size={16} className='mr-2 text-gray-400' /> Coordinates (Click map to set)</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                                <div className="md:col-span-2"><MapEditor initialLatitude={latitude} initialLongitude={longitude} onCoordsChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }} /></div>
                                <div className="space-y-3">
                                    {renderInputWithIcon("latitude", "Latitude", "number", latitude, (e) => setLatitude(parseNullableFloatInput(e.target.value)), <IconWorldLatitude className="h-4 w-4" />, "e.g., 8.7139", undefined, "any")}
                                    {renderInputWithIcon("longitude", "Longitude", "number", longitude, (e) => setLongitude(parseNullableFloatInput(e.target.value)), <IconWorldLongitude className="h-4 w-4" />, "e.g., 77.7567", undefined, "any")}
                                </div>
                            </div>
                        </div>
                    </fieldset>
                    {isHouseDetails(detailsState) && (<fieldset className="border border-gray-200 p-4 rounded-md"><legend className="text-base font-medium text-gray-900 px-2">House Details</legend><div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-6">
                        {renderInputWithIcon("houseName", "House/Apt Title", "text", detailsState.house_name, (e) => updateDetails('house_name', e.target.value), <IconHome className="h-4 w-4" />, "e.g., Villa Sunshine", undefined, undefined, true)}
                        {renderSelectWithIcon("houseType", "House Type", detailsState.house_type ?? 'APARTMENT_FLAT', (e) => updateDetails('house_type', e.target.value as HouseType), <IconBuildingCommunity className="h-4 w-4" />, houseTypeOptions)}
                        {renderInputWithIcon("numBedrooms", "Bedrooms", "number", detailsState.num_bedrooms, (e) => updateDetails('num_bedrooms', parseNumberInput(e.target.value)), <IconBed className="h-4 w-4" />, "e.g., 3", 0)}
                        {renderInputWithIcon("numBathrooms", "Bathrooms", "number", detailsState.num_bathrooms, (e) => updateDetails('num_bathrooms', parseNumberInput(e.target.value)), <IconNumber className="h-4 w-4" />, "e.g., 2", 0)}
                        {renderInputWithIcon("numBalconies", "Balconies", "number", detailsState.num_balconies, (e) => updateDetails('num_balconies', parseNumberInput(e.target.value)), <IconNumber className="h-4 w-4" />, "e.g., 1", 0)}
                        {renderInputWithIcon("totalFloorsHouse", "Total Floors (Building)", "number", detailsState.total_floors, (e) => updateDetails('total_floors', Math.max(1, parseNumberInput(e.target.value))), <IconBuilding className="h-4 w-4" />, "e.g., 10", 1)}
                        {renderInputWithIcon("floorNumber", "Floor Number", "number", detailsState.floor_number, (e) => updateDetails('floor_number', Math.max(0, parseNumberInput(e.target.value))), <IconBuilding className="h-4 w-4" />, "e.g., 5", 0)}
                        {renderSelectWithIcon("carParking", "Car Parking", detailsState.car_parking ?? '', (e) => updateDetails('car_parking', e.target.value || undefined), <IconNumber className="h-4 w-4" />, carParkingOptions)}
                        {renderSelectWithIcon("furnishedStatus", "Furnishing", detailsState.furnished_status ?? 'UNFURNISHED', (e) => updateDetails('furnished_status', e.target.value as FurnishedStatus), <IconArmchair className="h-4 w-4" />, furnishedStatusOptions)}
                        {renderSelectWithIcon("facingDirection", "Facing Direction", detailsState.facing_direction ?? 'NORTH', (e) => updateDetails('facing_direction', e.target.value as Direction), <IconCompass className="h-4 w-4" />, directionOptions)}
                        {renderSelectWithIcon("isCornerPlotHouse", "Corner Plot (House)", detailsState.is_corner_plot ?? false, (e) => updateDetails('is_corner_plot', e.target.value === 'true'), <IconCheckbox className="h-4 w-4" />, booleanOptions)}
                        {renderSelectWithIcon("waterSource", "Water Source", detailsState.water_source ?? 'MUNICIPAL', (e) => updateDetails('water_source', e.target.value as WaterSource), <IconToolsKitchen2 className="h-4 w-4" />, waterSourceOptions)}
                        {renderSelectWithIcon("powerBackup", "Power Backup", detailsState.power_backup ?? 'NONE', (e) => updateDetails('power_backup', e.target.value as PowerBackup), <IconCheckbox className="h-4 w-4" />, powerBackupOptions)}
                        {renderSelectWithIcon("liftFacility", "Lift Facility", detailsState.lift_facility_available ?? false, (e) => updateDetails('lift_facility_available', e.target.value === 'true'), <IconElevator className="h-4 w-4" />, booleanOptions)}
                    </div></fieldset>)}
                    {isLandDetails(detailsState) && (<fieldset className="border border-gray-200 p-4 rounded-md"><legend className="text-base font-medium text-gray-900 px-2">Land Details</legend><div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6">
                        {renderInputWithIcon("landName", "Land Title/Name", "text", detailsState.land_name, (e) => updateDetails('land_name', e.target.value), <IconMap className="h-4 w-4" />, "e.g., Green Acres Plot", undefined, undefined, true)}
                        {renderSelectWithIcon("landType", "Land Type", detailsState.land_type ?? 'RESIDENTIAL', (e) => updateDetails('land_type', e.target.value as LandType), <IconMap className="h-4 w-4" />, landTypeOptions, true)}
                        {renderInputWithIcon("plotDimensions", "Plot Dimensions", "text", detailsState.plot_dimensions, (e) => updateDetails('plot_dimensions', e.target.value), <IconDimensions className="h-4 w-4" />, "e.g., 50x100 ft")}
                        {renderInputWithIcon("roadAccessWidth", "Road Access Width (ft)", "number", detailsState.road_access_width_ft, (e) => updateDetails('road_access_width_ft', Math.max(0, parseNumberInput(e.target.value))), <IconRoad className="h-4 w-4" />, "e.g., 30", 0)}
                        {renderSelectWithIcon("isCornerPlotLand", "Corner Plot (Land)", detailsState.is_corner_plot ?? false, (e) => updateDetails('is_corner_plot', e.target.value === 'true'), <IconCheckbox className="h-4 w-4" />, booleanOptions)}
                        {renderSelectWithIcon("isDtcpApproved", "DTCP Approved", detailsState.is_dtcp_approved ?? false, (e) => updateDetails('is_dtcp_approved', e.target.value === 'true'), <IconSparkles className="h-4 w-4" />, booleanOptions)}
                    </div></fieldset>)}
                    {isBuildingDetails(detailsState) && (<fieldset className="border border-gray-200 p-4 rounded-md"><legend className="text-base font-medium text-gray-900 px-2">Building Details</legend><div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-6">
                        {renderInputWithIcon("buildingName", "Building Title/Name", "text", detailsState.building_name, (e) => updateDetails('building_name', e.target.value), <IconBuilding className="h-4 w-4" />, "e.g., Corporate Tower", undefined, undefined, true)}
                        {renderSelectWithIcon("buildingType", "Building Type", detailsState.building_type ?? 'OFFICE', (e) => updateDetails('building_type', e.target.value as BuildingType), <IconBuildingCommunity className="h-4 w-4" />, buildingTypeOptions, true)}
                        {renderInputWithIcon("totalFloorsBuilding", "Total Floors", "number", detailsState.total_floors, (e) => updateDetails('total_floors', Math.max(1, parseNumberInput(e.target.value))), <IconBuildingWarehouse className="h-4 w-4" />, "e.g., 15", 1)}
                        {renderInputWithIcon("numUnits", "Total Units", "number", detailsState.num_units, (e) => updateDetails('num_units', Math.max(1, parseNumberInput(e.target.value))), <IconLayoutGrid className="h-4 w-4" />, "e.g., 50", 1)}
                        {renderInputWithIcon("availableUnits", "Available Units", "number", detailsState.available_units, (e) => updateDetails('available_units', Math.max(0, parseNumberInput(e.target.value))), <IconHomeCheck className="h-4 w-4" />, "e.g., 10", 0)}
                        {renderInputWithIcon("commonAmenities", "Common Amenities (comma-separated)", "text", detailsState.common_amenities?.join(', ') ?? '', (e) => updateDetails('common_amenities', e.target.value.split(',').map(s => s.trim()).filter(Boolean)), <IconListDetails className="h-4 w-4" />, "e.g., Gym, Pool, Security")}
                    </div></fieldset>)}
                    <fieldset className="border border-gray-200 p-4 rounded-md">
                        <legend className="text-base font-medium text-gray-900 px-2">Availability & Features</legend>
                        <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-6">
                            {renderSelectWithIcon("availabilityStatus", "Availability Status", availabilityStatus, (e) => setAvailabilityStatus(e.target.value as AvailabilityStatus || undefined), <IconCircleCheck className="h-4 w-4" />, availabilityStatusOptions)}
                            <div className="flex items-center space-x-4 pt-5"><label htmlFor="isExclusive" className="text-sm font-medium text-gray-700 flex items-center"><IconHandGrab className="h-4 w-4 mr-2 text-gray-400" /> Exclusive Listing?</label><Switch checked={isExclusive} onChange={setIsExclusive} disabled={loading} className={`${isExclusive ? 'bg-[#D9A619]' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2`}><span className={`${isExclusive ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} /></Switch></div>
                            <div className="flex items-center space-x-4 pt-5"><label htmlFor="isFeatured" className="text-sm font-medium text-gray-700 flex items-center"><IconSparkles className="h-4 w-4 mr-2 text-gray-400" /> Featured Listing</label><Switch checked={isFeatured} onChange={setIsFeatured} disabled={loading} className={`${isFeatured ? 'bg-[#D9A619]' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2`}><span className={`${isFeatured ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} /></Switch></div>
                        </div>
                    </fieldset>
                    <fieldset className="border border-gray-200 p-4 rounded-md">
                        <legend className="text-base font-medium text-gray-900 px-2">Nearby Amenities</legend>
                        <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-6">
                            {renderSelectWithIcon("proximityUnit", "Proximity Unit", proximityUnit, (e) => setProximityUnit(e.target.value as ProximityUnit || undefined), <IconRuler className="h-4 w-4" />, proximityUnitOptions)}
                            {renderInputWithIcon("nearestHospital", "Nearest Hospital", "number", nearestHospital, (e) => setNearestHospital(parseNullableNumberInput(e.target.value)), <IconBuildingHospital className="h-4 w-4" />, `Distance in ${proximityUnit ? displayUtils.proximityUnitMap[proximityUnit] : 'units'}`, 0, "0.1")}
                            {renderInputWithIcon("nearestBusstop", "Nearest Bus Stop", "number", nearestBusstop, (e) => setNearestBusstop(parseNullableNumberInput(e.target.value)), <IconBus className="h-4 w-4" />, `Distance in ${proximityUnit ? displayUtils.proximityUnitMap[proximityUnit] : 'units'}`, 0, "0.1")}
                            {renderInputWithIcon("nearestGym", "Nearest Gym", "number", nearestGym, (e) => setNearestGym(parseNullableNumberInput(e.target.value)), <IconBarbell className="h-4 w-4" />, `Distance in ${proximityUnit ? displayUtils.proximityUnitMap[proximityUnit] : 'units'}`, 0, "0.1")}
                            {renderInputWithIcon("nearestPark", "Nearest Park", "number", nearestPark, (e) => setNearestPark(parseNullableNumberInput(e.target.value)), <IconFountain className="h-4 w-4" />, `Distance in ${proximityUnit ? displayUtils.proximityUnitMap[proximityUnit] : 'units'}`, 0, "0.1")}
                            {renderInputWithIcon("nearestSchool", "Nearest School", "number", nearestSchool, (e) => setNearestSchool(parseNullableNumberInput(e.target.value)), <IconSchool className="h-4 w-4" />, `Distance in ${proximityUnit ? displayUtils.proximityUnitMap[proximityUnit] : 'units'}`, 0, "0.1")}
                            {renderInputWithIcon("nearestSwimmingpool", "Nearest Pool", "number", nearestSwimmingpool, (e) => setNearestSwimmingpool(parseNullableNumberInput(e.target.value)), <IconSwimming className="h-4 w-4" />, `Distance in ${proximityUnit ? displayUtils.proximityUnitMap[proximityUnit] : 'units'}`, 0, "0.1")}
                        </div>
                    </fieldset>
                    <fieldset className="border border-gray-200 p-4 rounded-md">
                        <legend className="text-base font-medium text-gray-900 px-2">Additional Information</legend>
                        <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6">
                            {renderInputWithIcon("youtubeUrl", "YouTube Link", "text", youtubeUrl, (e) => setYoutubeUrl(e.target.value || undefined), <IconVideo className="h-4 w-4" />, "e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ", 0, undefined, false)}
                            {propertyType !== 'LAND' && renderInputWithIcon("yearBuilt", "Year Built", "number", yearBuilt, (e) => setYearBuilt(parseNullableNumberInput(e.target.value)), <IconCalendar className="h-4 w-4" />, "e.g., 2010", 1800)}
                            {renderInputWithIcon("description", "Public Description", "textarea", description, (e) => setDescription(e.target.value || undefined), <IconListDetails className="h-4 w-4" />, "Detailed property description...", undefined, undefined, false, 5)}
                            {renderInputWithIcon("submitterNotes", "Submitter Notes", "textarea", submitterNotes, (e) => setSubmitterNotes(e.target.value || undefined), <IconNotes className="h-4 w-4" />, "Notes from the person submitting...", undefined, undefined, false, 3)}
                            {renderInputWithIcon("adminNotes", "Admin Notes", "textarea", adminNotes, (e) => setAdminNotes(e.target.value || undefined), <IconNotes className="h-4 w-4" />, "Internal notes for admins...", undefined, undefined, false, 3)}
                            {listingType === 'RENTAL' && renderInputWithIcon("rentDueDay", "Rent Due Day (1-28)", "number", listingType === 'RENTAL' ? rentDueDay : undefined, (e) => setRentDueDay(parseNullableNumberInput(e.target.value)), <IconCalendar className="h-4 w-4" />, "Day of month", 1, "1", false)}
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Inventory Details</label>
                            <button type="button" onClick={() => setIsJsonEditorOpen(true)} className={getSecondaryButtonClasses() + " w-full justify-center"}><IconEdit size={16} className='mr-2' /> Edit Inventory Items</button>
                            <p className="text-xs text-gray-500 mt-1 italic">Add items like furniture, appliances included with the property.</p>
                        </div>
                    </fieldset>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end bg-gray-50"><div className="flex items-center space-x-3"><button type="button" onClick={onClose} className={getSecondaryButtonClasses()} disabled={loading}>Cancel</button><button type="submit" className={getPrimaryButtonClasses()} disabled={loading || managementPlansLoading}>{loading ? (<><LoadingSpinner size={16} className="mr-2" />Saving...</>) : (isEditing ? 'Update Property' : 'Add Property')}</button></div></div>
            </form>
            <JsonEditorModal isOpen={isJsonEditorOpen} onClose={() => setIsJsonEditorOpen(false)} initialJson={inventoryDetailsState} onSave={(updatedJson) => { setInventoryDetailsState(updatedJson); }} title="Edit Inventory Details" keyPlaceholder='Item Name (e.g., Sofa)' valuePlaceholder='Quantity/Description (e.g., 1, Good Condition)' predefinedKeys={["Fans", "Tubelights", "Sofas", "AirConditioners"]} />
        </>
    );
}

function PropertyFormModal({ isOpen, onClose, property, onSuccess }: PropertyFormModalProps) {
    const { showErrorNotification } = useNotification();
    const [managementPlans, setManagementPlans] = useState<ManagementPlanInfo[]>([]);
    const [managementPlansLoading, setManagementPlansLoading] = useState(false);

    const fetchManagementPlans = useCallback(async () => {
        setManagementPlansLoading(true);
        try {
            const { data, error: plansError } = await api.listManagementPlansAdmin(true);
            if (plansError) throw plansError;
            setManagementPlans(data || []);
        } catch (err) {
            console.error("Error fetching management plans:", err);
            showErrorNotification("Plan Load Error", "Could not fetch management plans.");
        } finally {
            setManagementPlansLoading(false);
        }
    }, [showErrorNotification]);

    useEffect(() => {
        if (isOpen) {
            fetchManagementPlans();
        }
    }, [isOpen, fetchManagementPlans]);

    const key = property?.property_id || 'new';

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={onClose}>
                <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black/30 backdrop-blur-sm" /></TransitionChild>
                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                            <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-6 sm:w-full sm:max-w-7xl ">
                                {isOpen && (
                                    <PropertyFormModalBody
                                        key={key}
                                        isOpen={isOpen}
                                        onClose={onClose}
                                        property={property}
                                        onSuccess={onSuccess}
                                        managementPlans={managementPlans}
                                        managementPlansLoading={managementPlansLoading}
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

export default PropertyFormModal;