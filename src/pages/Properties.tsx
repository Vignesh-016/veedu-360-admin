import { useEffect, useState, useCallback, Fragment, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    IconPlus, IconPaperclip, IconX,
    IconBuilding, IconChevronDown, IconHome, IconMountain, IconTag
} from '@tabler/icons-react';
import { useSearchParams } from 'react-router-dom';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';

import PropertyFormModal from '../components/PropertyFormModal';
import PropertyImageModal from '../components/PropertyImageModal';
import DocumentManager from '../components/DocumentManager';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../lib/supabaseClient';
import {
    AdminPropertySummary, PropertyType, ListingType, AdminPropertyDetails,
    PropertyAdminStatus,
    GetPropertiesAdminParams,
    ManagementPlanInfo, AdminUserSummary,
    SetPropertyListingStatusParams,
    PropertyDocument,
    AdminRole,
    DashboardStats
} from '../lib/types';
import { useNotification } from '../components/NotificationProvider';
import { useAuth } from '../lib/AuthContext';
import { getPrimaryButtonClasses, getSecondaryButtonClasses } from '../lib/twUtils';
import PropertyFilters from '../components/properties/PropertyFilters';
import PropertyList from '../components/properties/PropertyList';
import { getDefaultPropertyTabForUser, propertyWorkflowTabs, WorkflowTab, WorkflowTabConfig } from '../components/properties/WorkflowTabConfig';
import SearchableSelect from '../components/SearchableSelect';


const propertyDocumentTypes = [
    'Sale Deed', 'Parent Document', 'EC (Encumbrance Certificate)', 'Patta/Chitta',
    'Building Plan Approval', 'Tax Receipt (Property)', 'NOC (No Objection Certificate)',
    'Completion Certificate', 'Occupancy Certificate', 'Title Search Report',
    'Power of Attorney', 'Floor Plan', 'Elevation Drawing', 'Property Photos (Misc)', 'Other'
];
const propertyDocumentManagerRoles: AdminRole[] = ['super-admin', 'telecalling-owner-team', 'marketing-team'];

function Properties() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { showSuccessNotification, showErrorNotification } = useNotification();
    const { user: currentUser, roles, isSuperAdmin, loading: authLoading } = useAuth();

    const [properties, setProperties] = useState<AdminPropertySummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoadingPropertyId, setActionLoadingPropertyId] = useState<string | null>(null);
    const [markingVerifiedPropertyId, setMarkingVerifiedPropertyId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [selectedPropertyDetailsForModal, setSelectedPropertyDetailsForModal] = useState<AdminPropertyDetails | null>(null);
    const [modalContentLoading, setModalContentLoading] = useState(false);
    const [allManagementPlans, setAllManagementPlans] = useState<ManagementPlanInfo[]>([]);
    const [itemsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
    const [selectedPropertyForDocs, setSelectedPropertyForDocs] = useState<AdminPropertyDetails | null>(null);
    const [docsModalContentLoading, setDocsModalContentLoading] = useState(false);
    const [isInitialUrlParseDone, setIsInitialUrlParseDone] = useState(false);
    const [isAssignMarketerModalOpen, setIsAssignMarketerModalOpen] = useState(false);
    const [propertyToAssignMarketer, setPropertyToAssignMarketer] = useState<string | null>(null);
    const [marketingAdmins, setMarketingAdmins] = useState<AdminUserSummary[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);

    const visibleTabs = useMemo(() => propertyWorkflowTabs.filter(tab =>
        tab.allowedRoles.some(role => roles.includes(role))
    ), [roles]);

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [activeWorkflowTab, setActiveWorkflowTab] = useState<WorkflowTab>('all');
    const [propertyTypeFilter, setPropertyTypeFilter] = useState<PropertyType[]>([]);
    const [listingTypeFilter, setListingTypeFilter] = useState<ListingType[]>([]);
    const [statusesFilter, setStatusesFilter] = useState<PropertyAdminStatus[]>([]);
    const [isListedFilter, setIsListedFilter] = useState<boolean | undefined>(undefined);
    const [isExclusiveFilter, setIsExclusiveFilter] = useState<boolean | undefined>(undefined);
    const [priceMinFilter, setPriceMinFilter] = useState<number | undefined>(undefined);
    const [priceMaxFilter, setPriceMaxFilter] = useState<number | undefined>(undefined);
    const [cityFilter, setCityFilter] = useState<string>('');
    const [pincodeFilter, setPincodeFilter] = useState<string>('');
    const [propertySearch, setPropertySearch] = useState<string>('');
    const [managementPlanFilter, setManagementPlanFilter] = useState<string | undefined>(undefined);
    const [submitterIdFilter, setSubmitterIdFilter] = useState<string | undefined>(undefined);
    const [tenantIdFilter, setTenantIdFilter] = useState<string | undefined>(undefined);

    const canManageListings = isSuperAdmin || roles.includes('marketing-team');

    useEffect(() => {
        if (authLoading || !currentUser || !visibleTabs.length) return;

        const pageFromUrl = Number(searchParams.get('page')) || 1;
        const tabFromUrlParams = searchParams.get('tab') as WorkflowTab | null;
        const defaultTab = getDefaultPropertyTabForUser(roles, visibleTabs);
        const effectiveTabFromUrl = tabFromUrlParams && visibleTabs.find(vt => vt.key === tabFromUrlParams) ? tabFromUrlParams : defaultTab;

        setCurrentPage(pageFromUrl);
        setActiveWorkflowTab(effectiveTabFromUrl);
        setPropertyTypeFilter(searchParams.getAll('property_type') as PropertyType[]);
        setListingTypeFilter(searchParams.getAll('listing_type') as ListingType[]);
        setStatusesFilter(searchParams.getAll('admin_status') as PropertyAdminStatus[]);
        const listed = searchParams.get('is_listed');
        setIsListedFilter(listed === null ? undefined : listed === 'true');
        const exclusive = searchParams.get('is_exclusive');
        setIsExclusiveFilter(exclusive === null ? undefined : exclusive === 'true');
        setPriceMinFilter(searchParams.get('price_min') ? Number(searchParams.get('price_min')) : undefined);
        setPriceMaxFilter(searchParams.get('price_max') ? Number(searchParams.get('price_max')) : undefined);
        setCityFilter(searchParams.get('city') || '');
        setPincodeFilter(searchParams.get('pincode') || '');
        setPropertySearch(searchParams.get('search') || '');
        setManagementPlanFilter(searchParams.get('mgmt_plan') || undefined);
        setSubmitterIdFilter(searchParams.get('submitter_id') || undefined);
        setTenantIdFilter(searchParams.get('tenant_id') || undefined);

        setIsInitialUrlParseDone(true);
    }, [searchParams, authLoading, currentUser, roles, visibleTabs]);


    const buildFilterParams = useCallback((
        tabForBuild: WorkflowTab,
        currentPropertyTypeFilter: PropertyType[],
        currentListingTypeFilter: ListingType[],
        currentStatusesFilter: PropertyAdminStatus[],
        currentIsListedFilter: boolean | undefined,
        currentIsExclusiveFilter: boolean | undefined,
        currentPriceMinFilter: number | undefined,
        currentPriceMaxFilter: number | undefined,
        currentCityFilter: string,
        currentPincodeFilterState: string,
        currentPropertySearch: string,
        currentManagementPlanFilter: string | undefined,
        currentSubmitterIdFilter: string | undefined,
        currentTenantIdFilter: string | undefined
    ): GetPropertiesAdminParams => {
        const pincodeArray = currentPincodeFilterState.split(',').map(p => Number(p.trim())).filter(p => !isNaN(p) && p > 0);
        const baseParams: GetPropertiesAdminParams = {
            p_property_types: currentPropertyTypeFilter.length > 0 ? currentPropertyTypeFilter : undefined,
            p_listing_types: currentListingTypeFilter.length > 0 ? currentListingTypeFilter : undefined,
            p_admin_statuses: currentStatusesFilter.length > 0 ? currentStatusesFilter : undefined,
            p_is_listed_filter: currentIsListedFilter,
            p_is_exclusive: currentIsExclusiveFilter,
            p_price_min: currentPriceMinFilter,
            p_price_max: currentPriceMaxFilter,
            p_city: currentCityFilter || undefined,
            p_pincodes: pincodeArray.length > 0 ? pincodeArray : undefined,
            p_property_search: currentPropertySearch || undefined,
            p_management_plan_id: currentManagementPlanFilter || undefined,
            p_submitter_id: currentSubmitterIdFilter || undefined,
            p_tenant_id: currentTenantIdFilter || undefined,
        };

        switch (tabForBuild) {
            case 'assignableOwnerContact':
                baseParams.p_admin_statuses = ['SUBMITTED'];
                baseParams.p_owner_contact_assignment_status = 'UNASSIGNED';
                break;
            case 'myOwnerContactAssignments':
                baseParams.p_admin_statuses = ['OWNER_CONTACT_PENDING'];
                baseParams.p_owner_contact_assigned_to_admin_id = currentUser?.id;
                break;
            case 'assignableMarketing':
                baseParams.p_admin_statuses = ['OWNER_VERIFIED'];
                baseParams.p_marketing_assignment_status = 'UNASSIGNED';
                break;
            case 'myMarketingAssignments':
                baseParams.p_admin_statuses = ['MARKETING_VISIT_PENDING'];
                baseParams.p_marketing_assignment_status = 'ASSIGNED';
                baseParams.p_marketing_assigned_to_admin_id = currentUser?.id;
                break;
            case 'all':
            default:
                break;
        }
        return baseParams;
    }, [currentUser?.id]);


    const fetchProperties = useCallback(async (pageToFetch: number, tabForFetch: WorkflowTab) => {
        if (authLoading || !currentUser) return;
        setLoading(true);
        setError(null);
        const offset = (pageToFetch - 1) * itemsPerPage;

        const builtParams = buildFilterParams(
            tabForFetch, propertyTypeFilter, listingTypeFilter, statusesFilter, isListedFilter,
            isExclusiveFilter, priceMinFilter, priceMaxFilter, cityFilter, pincodeFilter,
            propertySearch, managementPlanFilter, submitterIdFilter, tenantIdFilter
        );

        const apiCallParams: GetPropertiesAdminParams = {
            ...builtParams,
            p_offset: offset,
            p_limit: itemsPerPage,
        };

        try {
            const { data, error: fetchError } = await api.getPropertiesAdmin(apiCallParams);
            if (fetchError) throw new Error(typeof fetchError === 'string' ? fetchError : fetchError.message);
            const visibleProperties = (data || []).filter(property => String(property.admin_status) !== 'PAYMENT_PENDING');
            setProperties(visibleProperties);
            setTotalCount(visibleProperties.length > 0 ? visibleProperties[0].total_count : 0);
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to fetch properties';
            setError(errMsg); showErrorNotification("Error Fetching Properties", errMsg);
            setProperties([]); setTotalCount(0);
        } finally {
            setLoading(false);
        }
    }, [
        authLoading, currentUser, itemsPerPage, showErrorNotification, buildFilterParams,
        propertyTypeFilter, listingTypeFilter, statusesFilter, isListedFilter, isExclusiveFilter,
        priceMinFilter, priceMaxFilter, cityFilter, pincodeFilter, propertySearch,
        managementPlanFilter, submitterIdFilter, tenantIdFilter
    ]);

    useEffect(() => {
        if (!isInitialUrlParseDone || authLoading || !currentUser) return;
        fetchProperties(currentPage, activeWorkflowTab);
    }, [
        isInitialUrlParseDone, authLoading, currentUser, currentPage, activeWorkflowTab, fetchProperties
    ]);


    const updateUrlFilters = useCallback((newPage?: number, newTab?: WorkflowTab) => {
        const params = new URLSearchParams();
        const effectiveTab = newTab || activeWorkflowTab;
        const pageToSet = newPage || currentPage;

        if (propertyTypeFilter.length > 0) propertyTypeFilter.forEach(val => params.append('property_type', val));
        if (listingTypeFilter.length > 0) listingTypeFilter.forEach(val => params.append('listing_type', val));
        if (effectiveTab === 'all' && statusesFilter.length > 0) statusesFilter.forEach(val => params.append('admin_status', val));
        if (isListedFilter !== undefined) params.set('is_listed', String(isListedFilter));
        if (isExclusiveFilter !== undefined) params.set('is_exclusive', String(isExclusiveFilter));
        if (priceMinFilter !== undefined) params.set('price_min', String(priceMinFilter));
        if (priceMaxFilter !== undefined) params.set('price_max', String(priceMaxFilter));
        if (cityFilter) params.set('city', cityFilter);
        if (pincodeFilter) params.set('pincode', pincodeFilter);
        if (propertySearch) params.set('search', propertySearch);
        if (managementPlanFilter) params.set('mgmt_plan', managementPlanFilter);
        if (submitterIdFilter) params.set('submitter_id', submitterIdFilter);
        if (tenantIdFilter) params.set('tenant_id', tenantIdFilter);

        params.set('page', String(pageToSet));
        params.set('tab', effectiveTab);
        setSearchParams(params, { replace: true });
    }, [
        activeWorkflowTab, currentPage, setSearchParams,
        propertyTypeFilter, listingTypeFilter, statusesFilter, isListedFilter, isExclusiveFilter,
        priceMinFilter, priceMaxFilter, cityFilter, pincodeFilter, propertySearch,
        managementPlanFilter, submitterIdFilter, tenantIdFilter
    ]);


    const handleTabChange = (newTab: WorkflowTab) => {
        setLoading(true);
        setActiveWorkflowTab(newTab);
        setCurrentPage(1);
        if (newTab !== 'all') {
            setStatusesFilter([]);
        }
        updateUrlFilters(1, newTab);
    };

    const fetchManagementPlansForFilter = useCallback(async () => {
        try {
            const { data, error: plansError } = await api.listManagementPlansAdmin(true);
            if (plansError) throw plansError;
            setAllManagementPlans(data || []);
        } catch (err) {
            showErrorNotification("Plan Load Error", "Could not fetch management plans for filter.");
        }
    }, [showErrorNotification]);

    const fetchMarketingAdmins = useCallback(async () => {
        if (!isSuperAdmin) return;
        try {
            const { data, error: adminError } = await api.listAdmins('marketing-team', true);
            if (adminError) throw adminError;
            setMarketingAdmins(data || []);
        } catch (err) {
            showErrorNotification("Admin Load Error", "Could not fetch marketing admins.");
        }
    }, [isSuperAdmin, showErrorNotification]);

    const fetchDashboardStats = useCallback(async () => {
        try {
            const { data, error: statsError } = await api.getDashboardStatsAdmin();
            if (statsError) throw statsError;
            setStats(data);
        } catch (err) {
            console.error("Error fetching dashboard stats:", err);
        }
    }, []);

    useEffect(() => {
        fetchMarketingAdmins();
        fetchManagementPlansForFilter();
        fetchDashboardStats();
    }, [fetchMarketingAdmins, fetchManagementPlansForFilter, fetchDashboardStats]);

    const prepareModal = async (propertyId: string, modalType: 'form' | 'image') => {
        setModalContentLoading(true);
        setSelectedPropertyDetailsForModal({ property_id: propertyId } as AdminPropertyDetails);
        if (modalType === 'form') setIsFormModalOpen(true);
        else if (modalType === 'image') setIsImageModalOpen(true);

        try {
            const { data, error: detailsError } = await api.getPropertyDetailsAdmin(propertyId);
            if (detailsError) throw new Error(typeof detailsError === 'string' ? detailsError : detailsError.message);
            if (!data) throw new Error("Property details not found.");
            setSelectedPropertyDetailsForModal(data);
        } catch (err) {
            showErrorNotification("Error Loading Details", err instanceof Error ? err.message : 'Failed to load property details.');
            if (modalType === 'form') setIsFormModalOpen(false);
            else if (modalType === 'image') setIsImageModalOpen(false);
        } finally {
            setModalContentLoading(false);
        }
    };

    const handleEditInfo = (propertyId: string) => prepareModal(propertyId, 'form');
    const handleEditImages = (propertyId: string) => prepareModal(propertyId, 'image');
    const handleAddProperty = () => { setSelectedPropertyDetailsForModal(null); setIsFormModalOpen(true); };
    const handleFormModalClose = () => { setIsFormModalOpen(false); setSelectedPropertyDetailsForModal(null); };
    const handleImageModalClose = () => { setIsImageModalOpen(false); setSelectedPropertyDetailsForModal(null); };

    const handleDeleteProperty = async (propertyId: string) => {
        if (window.confirm('Are you sure you want to delete this property?')) {
            setActionLoadingPropertyId(propertyId);
            try {
                await api.deletePropertyAdmin(propertyId);
                showSuccessNotification("Property Deleted", "Property deleted successfully!");
                fetchProperties(properties.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage, activeWorkflowTab);
            } catch (err) {
                showErrorNotification("Deletion Error", err instanceof Error ? err.message : 'Failed to delete.');
            } finally {
                setActionLoadingPropertyId(null);
            }
        }
    };

    const handleToggleListed = async (property: AdminPropertySummary) => {
        if (!canManageListings) { showErrorNotification("Permission Denied", "Not authorized."); return; }
        setActionLoadingPropertyId(property.property_id);
        try {
            const newListedStatus = !property.is_listed;
            let newAdminStatusUpdate: PropertyAdminStatus | undefined = undefined;
            if (newListedStatus && property.admin_status === 'MARKETING_VERIFIED') newAdminStatusUpdate = 'AWAITING_LISTING';
            else if (!newListedStatus && ['MARKETING_VERIFIED', 'AWAITING_LISTING', 'LISTED'].includes(property.admin_status)) newAdminStatusUpdate = 'SUSPENDED';

            const params: SetPropertyListingStatusParams = { p_property_id: property.property_id, p_make_listed: newListedStatus };
            if (newAdminStatusUpdate) params.p_new_admin_status = newAdminStatusUpdate;

            await api.setPropertyListingStatus(params);
            showSuccessNotification("Listing Status Updated", `Property ${newListedStatus ? 'listed' : 'unlisted'}.`);
            fetchProperties(currentPage, activeWorkflowTab);
        } catch (err) {
            showErrorNotification("Update Failed", err instanceof Error ? err.message : "Could not update status.");
        } finally {
            setActionLoadingPropertyId(null);
        }
    };

    const handleSelfAssignOwnerContact = async (propertyId: string) => {
        setActionLoadingPropertyId(propertyId);
        try {
            if (!roles.includes('telecalling-owner-team') && !isSuperAdmin) { showErrorNotification("Permission Denied", "Not authorized."); return; }
            await api.selfAssignPropertyForOwnerContact(propertyId);
            showSuccessNotification("Property Assigned", `Property assigned.`);
            fetchProperties(currentPage, activeWorkflowTab);
        } catch (err) {
            showErrorNotification("Assignment Failed", err instanceof Error ? err.message : "Could not assign.");
        } finally { setActionLoadingPropertyId(null); }
    };

    const handleMarkOwnerVerified = async (propertyId: string) => {
        const notes = prompt("Verification notes (optional):");
        setMarkingVerifiedPropertyId(propertyId);
        try {
            if (!roles.includes('telecalling-owner-team') && !isSuperAdmin) { showErrorNotification("Permission Denied", "Not authorized."); return; }
            await api.markPropertyOwnerVerified({ p_property_id: propertyId, p_verification_notes: notes || undefined });
            showSuccessNotification("Property Verified", `Marked as owner verified.`);
            fetchProperties(currentPage, activeWorkflowTab);
        } catch (err) {
            showErrorNotification("Verification Failed", err instanceof Error ? err.message : "Could not verify.");
        } finally { setMarkingVerifiedPropertyId(null); }
    };

    const handleMarkMarketingVerified = async (propertyId: string) => {
        const notes = prompt("Marketing verification notes (optional):");
        setMarkingVerifiedPropertyId(propertyId);
        try {
            if (!roles.includes('marketing-team') && !isSuperAdmin) { showErrorNotification("Permission Denied", "Not authorized."); return; }
            await api.markPropertyMarketingVerified({ p_property_id: propertyId, p_marketing_notes: notes || undefined });
            showSuccessNotification("Property Verified", `Marked as marketing verified.`);
            fetchProperties(currentPage, activeWorkflowTab);
        } catch (err) {
            showErrorNotification("Verification Failed", err instanceof Error ? err.message : "Could not verify.");
        } finally { setMarkingVerifiedPropertyId(null); }
    };

    const handleTriggerAssignToMarketer = (propertyId: string) => {
        if (!isSuperAdmin) return;
        setPropertyToAssignMarketer(propertyId);
        if (marketingAdmins.length === 0) fetchMarketingAdmins();
        setIsAssignMarketerModalOpen(true);
    };

    const handleConfirmAssignMarketer = async (selectedAdminId: string | undefined) => {
        if (!propertyToAssignMarketer || !selectedAdminId) {
            showErrorNotification("Selection Error", "No marketer selected or property ID missing.");
            return;
        }
        setActionLoadingPropertyId(propertyToAssignMarketer);
        try {
            await api.assignPropertyToMarketer({ p_property_id: propertyToAssignMarketer, p_target_admin_id: selectedAdminId });
            showSuccessNotification("Marketer Assigned", "Property assigned to marketer.");
            fetchProperties(currentPage, activeWorkflowTab);
            setIsAssignMarketerModalOpen(false);
            setPropertyToAssignMarketer(null);
        } catch (err) {
            showErrorNotification("Assignment Failed", err instanceof Error ? err.message : "Could not assign marketer.");
        } finally { setActionLoadingPropertyId(null); }
    };

    const handleUnassignFromMarketer = async (propertyId: string) => {
        if (!isSuperAdmin || !window.confirm("Are you sure you want to unassign the marketer from this property?")) return;
        setActionLoadingPropertyId(propertyId);
        try {
            await api.unassignPropertyFromMarketer(propertyId);
            showSuccessNotification("Marketer Unassigned", "Property unassigned from marketer.");
            fetchProperties(currentPage, activeWorkflowTab);
        } catch (err) {
            showErrorNotification("Unassignment Failed", err instanceof Error ? err.message : "Could not unassign marketer.");
        } finally { setActionLoadingPropertyId(null); }
    };

    const refetchPropertyDetailsForModal = useCallback(async () => {
        if (!selectedPropertyDetailsForModal?.property_id) return;
        try {
            const { data, error: detailsError } = await api.getPropertyDetailsAdmin(selectedPropertyDetailsForModal.property_id);
            if (detailsError) throw new Error(typeof detailsError === 'string' ? detailsError : detailsError.message);
            if (!data) throw new Error("Property details not found after update.");
            setSelectedPropertyDetailsForModal(data);
        } catch (err) {
            console.error("Error refreshing modal property details:", err);
            showErrorNotification("Refresh Error", err instanceof Error ? err.message : 'Failed to refresh property details for modal.');
        }
    }, [selectedPropertyDetailsForModal, showErrorNotification]);

    const handleApplyFilters = () => { setCurrentPage(1); updateUrlFilters(1, activeWorkflowTab); };
    const handleClearFilters = () => {
        setPropertyTypeFilter([]); setListingTypeFilter([]); setStatusesFilter([]);
        setIsListedFilter(undefined); setIsExclusiveFilter(undefined);
        setPriceMinFilter(undefined); setPriceMaxFilter(undefined);
        setCityFilter(''); setPincodeFilter(''); setPropertySearch('');
        setManagementPlanFilter(undefined); setSubmitterIdFilter(undefined); setTenantIdFilter(undefined);
        setCurrentPage(1);
        const newParams = new URLSearchParams();
        newParams.set('page', '1');
        newParams.set('tab', activeWorkflowTab);
        setSearchParams(newParams, { replace: true });
    };

    const handleNextPage = () => { const newPage = currentPage + 1; updateUrlFilters(newPage, activeWorkflowTab); };
    const handlePrevPage = () => { const newPage = Math.max(currentPage - 1, 1); updateUrlFilters(newPage, activeWorkflowTab); };

    const filterSetters = {
        setPropertyTypeFilter, setListingTypeFilter, setStatusesFilter, setIsListedFilter,
        setIsExclusiveFilter, setPriceMinFilter, setPriceMaxFilter, setCityFilter,
        setPincodeFilter, setPropertySearch, setManagementPlanFilter, setSubmitterIdFilter,
        setTenantIdFilter
    };
    const currentFilterValues = {
        propertyTypeFilter, listingTypeFilter, statusesFilter, isListedFilter,
        isExclusiveFilter, priceMinFilter, priceMaxFilter, cityFilter,
        pincodeFilter, propertySearch, managementPlanFilter, submitterIdFilter,
        tenantIdFilter
    };
    const companyName = import.meta.env.VITE_COMPANY_NAME || "Admin Panel";

    const renderTabButton = (tabConfig: WorkflowTabConfig) => (
        <button
            key={tabConfig.key}
            onClick={() => handleTabChange(tabConfig.key)}
            className={`px-4 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 focus:outline-none whitespace-nowrap flex items-center
                ${activeWorkflowTab === tabConfig.key
                    ? 'bg-[#D9A619] text-white shadow-md ring-2 ring-[#D9A619] ring-offset-2'
                    : 'text-gray-500 hover:bg-white hover:text-[#D9A619] border border-transparent hover:border-gray-200 font-normal'
                }`}
            disabled={loading}
        >
            {tabConfig.icon}
            <span className="ml-2">{tabConfig.label}</span>
        </button>
    );

    const handleOpenDocumentManager = async (propertyId: string) => {
        setDocsModalContentLoading(true); setIsDocumentModalOpen(true); setSelectedPropertyForDocs(null);
        try {
            const { data, error: detailsError } = await api.getPropertyDetailsAdmin(propertyId);
            if (detailsError) throw new Error(typeof detailsError === 'string' ? detailsError : detailsError.message);
            if (!data) throw new Error("Property details not found for document management.");
            setSelectedPropertyForDocs(data);
        } catch (err) {
            showErrorNotification("Error Loading Details", err instanceof Error ? err.message : 'Failed to load property details.');
            setIsDocumentModalOpen(false);
        } finally { setDocsModalContentLoading(false); }
    };
    const handleCloseDocumentManager = () => { setIsDocumentModalOpen(false); setSelectedPropertyForDocs(null); };
    const handleDocumentUploadSuccess = (newDocument: PropertyDocument) => {
        setSelectedPropertyForDocs(prev => prev ? { ...prev, property_documents: [...(prev.property_documents || []), newDocument] } : null);
        fetchProperties(currentPage, activeWorkflowTab);
    };
    const handleDocumentDeleteSuccess = (deletedDocumentId: string) => {
        setSelectedPropertyForDocs(prev => prev ? { ...prev, property_documents: (prev.property_documents || []).filter(doc => doc.document_id !== deletedDocumentId) } : null);
        fetchProperties(currentPage, activeWorkflowTab);
    };

    if (authLoading && !currentUser) {
        return <div className="flex items-center justify-center h-screen"><LoadingSpinner size={40} /></div>;
    }
    if (!isInitialUrlParseDone && !authLoading && currentUser) {
        return <div className="flex items-center justify-center h-screen"><LoadingSpinner size={40} /></div>;
    }


    return (
        <>
            <Helmet><title>{`Properties | ${companyName}`}</title></Helmet>
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    {error && !modalContentLoading && !docsModalContentLoading && (<div className="mb-6 bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-md shadow-sm animate-fadeIn" role="alert"><p className="font-bold">Error</p><p>{error}</p></div>)}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Properties</h1>
                            <p className="mt-1 text-sm text-gray-500 font-normal">Track and manage your real estate portfolio</p>
                        </div>
                        <button onClick={handleAddProperty} className={`${getPrimaryButtonClasses()} !rounded-full px-6 py-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 font-medium`}>
                            <IconPlus className="mr-2" size={20} stroke={2} /> List New Property
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                <IconBuilding size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-normal text-gray-500">Total Properties</p>
                                <p className="text-2xl font-bold text-gray-900">{stats?.properties?.total_properties || 0}</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                <IconBuilding size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-normal text-gray-500">Houses</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {(stats?.properties?.properties_by_type as any)?.HOUSE || 0}
                                </p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                <IconBuilding size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-normal text-gray-500">Buildings</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {(stats?.properties?.properties_by_type as any)?.BUILDING || 0}
                                </p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                                <IconBuilding size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-normal text-gray-500">Lands</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {(stats?.properties?.properties_by_type as any)?.LAND || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-8 flex space-x-2 border-b-0 pb-2 overflow-x-auto no-scrollbar">
                        {visibleTabs.map(renderTabButton)}
                    </div>

                    <PropertyFilters
                        filters={currentFilterValues}
                        setters={filterSetters}
                        allManagementPlans={allManagementPlans}
                        onApplyFilters={handleApplyFilters}
                        onClearFilters={handleClearFilters}
                        isDisclosureOpenByDefault={searchParams.toString().length > 0 && !searchParams.get('page') && !searchParams.get('tab')}
                    />
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-medium text-gray-800">
                                    Property Listings ({visibleTabs.find(t => t.key === activeWorkflowTab)?.label || 'Current View'})
                                </h2>
                                <div className="flex items-center gap-3">
                                    {loading && <LoadingSpinner size={20} />}
                                    <div className="flex items-center gap-2">
                                        {/* Listing Type Dropdown */}
                                        <Menu as="div" className="relative inline-block text-left">
                                            <div>
                                                <MenuButton className="inline-flex w-full justify-center items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all duration-200">
                                                    <IconTag className="-ml-0.5 h-4 w-4 text-gray-400" aria-hidden="true" />
                                                    Listing View
                                                    <IconChevronDown className="-mr-1 h-4 w-4 text-gray-400" aria-hidden="true" />
                                                </MenuButton>
                                            </div>

                                            <Transition
                                                as={Fragment}
                                                enter="transition ease-out duration-100"
                                                enterFrom="transform opacity-0 scale-95"
                                                enterTo="transform opacity-100 scale-100"
                                                leave="transition ease-in duration-75"
                                                leaveFrom="transform opacity-100 scale-100"
                                                leaveTo="transform opacity-0 scale-95"
                                            >
                                                <MenuItems className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100">
                                                    <div className="py-1">
                                                        <MenuItem>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() => { setListingTypeFilter([]); setCurrentPage(1); }}
                                                                    className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} group flex items-center w-full px-4 py-2 text-sm transition-colors`}
                                                                >
                                                                    All Listings
                                                                </button>
                                                            )}
                                                        </MenuItem>
                                                    </div>
                                                    <div className="py-1">
                                                        <MenuItem>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() => { setListingTypeFilter(['RENTAL']); setCurrentPage(1); }}
                                                                    className={`${active ? 'bg-blue-50 text-blue-700' : 'text-gray-700'} group flex items-center w-full px-4 py-2 text-sm transition-colors`}
                                                                >
                                                                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                                                                    For Rental
                                                                </button>
                                                            )}
                                                        </MenuItem>
                                                        <MenuItem>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() => { setListingTypeFilter(['SALE']); setCurrentPage(1); }}
                                                                    className={`${active ? 'bg-orange-50 text-orange-700' : 'text-gray-700'} group flex items-center w-full px-4 py-2 text-sm transition-colors`}
                                                                >
                                                                    <div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div>
                                                                    For Sale
                                                                </button>
                                                            )}
                                                        </MenuItem>
                                                    </div>
                                                </MenuItems>
                                            </Transition>
                                        </Menu>

                                        {/* Property Type Dropdown */}
                                        <Menu as="div" className="relative inline-block text-left">
                                            <div>
                                                <MenuButton className="inline-flex w-full justify-center items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all duration-200">
                                                    <IconBuilding className="-ml-0.5 h-4 w-4 text-gray-400" aria-hidden="true" />
                                                    Property View
                                                    <IconChevronDown className="-mr-1 h-4 w-4 text-gray-400" aria-hidden="true" />
                                                </MenuButton>
                                            </div>

                                            <Transition
                                                as={Fragment}
                                                enter="transition ease-out duration-100"
                                                enterFrom="transform opacity-0 scale-95"
                                                enterTo="transform opacity-100 scale-100"
                                                leave="transition ease-in duration-75"
                                                leaveFrom="transform opacity-100 scale-100"
                                                leaveTo="transform opacity-0 scale-95"
                                            >
                                                <MenuItems className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100">
                                                    <div className="py-1">
                                                        <MenuItem>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() => { setPropertyTypeFilter([]); setCurrentPage(1); }}
                                                                    className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} group flex items-center w-full px-4 py-2 text-sm transition-colors`}
                                                                >
                                                                    All Properties
                                                                </button>
                                                            )}
                                                        </MenuItem>
                                                    </div>
                                                    <div className="py-1">
                                                        <MenuItem>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() => { setPropertyTypeFilter(['HOUSE']); setCurrentPage(1); }}
                                                                    className={`${active ? 'bg-purple-50 text-purple-700' : 'text-gray-700'} group flex items-center w-full px-4 py-2 text-sm transition-colors`}
                                                                >
                                                                    <IconHome size={16} className="mr-2 text-purple-500" />
                                                                    Houses / Villas
                                                                </button>
                                                            )}
                                                        </MenuItem>
                                                        <MenuItem>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() => { setPropertyTypeFilter(['BUILDING']); setCurrentPage(1); }}
                                                                    className={`${active ? 'bg-green-50 text-green-700' : 'text-gray-700'} group flex items-center w-full px-4 py-2 text-sm transition-colors`}
                                                                >
                                                                    <IconBuilding size={16} className="mr-2 text-green-500" />
                                                                    Buildings
                                                                </button>
                                                            )}
                                                        </MenuItem>
                                                        <MenuItem>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() => { setPropertyTypeFilter(['LAND']); setCurrentPage(1); }}
                                                                    className={`${active ? 'bg-amber-50 text-amber-700' : 'text-gray-700'} group flex items-center w-full px-4 py-2 text-sm transition-colors`}
                                                                >
                                                                    <IconMountain size={16} className="mr-2 text-amber-500" />
                                                                    Lands
                                                                </button>
                                                            )}
                                                        </MenuItem>
                                                    </div>
                                                </MenuItems>
                                            </Transition>
                                        </Menu>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{loading && totalCount === 0 && properties.length === 0 ? 'Loading properties...' : totalCount > 0 ? `Showing ${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, totalCount)} of ${totalCount} properties` : 'No properties found matching your criteria'}</p>
                        </div>
                        <PropertyList
                            properties={properties}
                            loading={loading && properties.length === 0}
                            actionLoadingPropertyId={actionLoadingPropertyId}
                            markingVerifiedPropertyId={markingVerifiedPropertyId}
                            totalCount={totalCount}
                            currentPage={currentPage}
                            itemsPerPage={itemsPerPage}
                            onEditInfo={handleEditInfo}
                            onEditImages={handleEditImages}
                            onDeleteProperty={handleDeleteProperty}
                            onToggleListed={handleToggleListed}
                            onNextPage={handleNextPage}
                            onPrevPage={handlePrevPage}
                            canManageListings={canManageListings}
                            activeWorkflowTab={activeWorkflowTab}
                            currentUserRoles={roles}
                            currentUserId={currentUser?.id}
                            onSelfAssignOwnerContact={handleSelfAssignOwnerContact}
                            onMarkOwnerVerified={handleMarkOwnerVerified}
                            onMarkMarketingVerified={handleMarkMarketingVerified}
                            onTriggerAssignToMarketer={handleTriggerAssignToMarketer}
                            onUnassignFromMarketer={handleUnassignFromMarketer}
                            onManageDocuments={handleOpenDocumentManager}
                        />
                    </div>
                </div>

                <PropertyFormModal isOpen={isFormModalOpen} onClose={handleFormModalClose} property={modalContentLoading ? null : selectedPropertyDetailsForModal} onSuccess={() => fetchProperties(currentPage, activeWorkflowTab)} />
                {selectedPropertyDetailsForModal && isImageModalOpen && (
                    <PropertyImageModal
                        isOpen={isImageModalOpen}
                        onClose={handleImageModalClose}
                        propertyId={selectedPropertyDetailsForModal.property_id}
                        initialImages={selectedPropertyDetailsForModal.property_images || []}
                        onImagesUpdated={() => {
                            refetchPropertyDetailsForModal();
                            fetchProperties(currentPage, activeWorkflowTab);
                        }} />
                )}

                <Transition show={isDocumentModalOpen} as={Fragment}>
                    <Dialog as="div" className="relative z-30" onClose={handleCloseDocumentManager}>
                        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                        </TransitionChild>
                        <div className="fixed inset-0 overflow-y-auto">
                            <div className="flex min-h-full items-center justify-center p-4 text-center">
                                <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                    <DialogPanel className="w-full max-w-3xl transform overflow-hidden rounded-lg bg-white p-0 text-left align-middle shadow-xl transition-all">
                                        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
                                            <DialogTitle as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                                                <IconPaperclip size={18} className="mr-2 text-gray-500" />
                                                Manage Documents: {selectedPropertyForDocs?.address ? (selectedPropertyForDocs.address.length > 40 ? selectedPropertyForDocs.address.substring(0, 37) + "..." : selectedPropertyForDocs.address) : (selectedPropertyForDocs?.property_id.substring(0, 8) || 'Loading...')}
                                            </DialogTitle>
                                            <button type="button" className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none" onClick={handleCloseDocumentManager}><IconX size={20} /></button>
                                        </div>
                                        <div className="p-1 min-h-[300px]">
                                            {docsModalContentLoading && <div className="py-10 flex justify-center"><LoadingSpinner /></div>}
                                            {!docsModalContentLoading && selectedPropertyForDocs && (
                                                <DocumentManager
                                                    ownerId={selectedPropertyForDocs.property_id}
                                                    ownerType="property"
                                                    documents={selectedPropertyForDocs.property_documents || []}
                                                    onUploadSuccess={handleDocumentUploadSuccess}
                                                    onDeleteSuccess={handleDocumentDeleteSuccess}
                                                    allowedRoles={propertyDocumentManagerRoles}
                                                    documentTypes={propertyDocumentTypes}
                                                    title=""
                                                    icon={<></>}
                                                />
                                            )}
                                            {!docsModalContentLoading && !selectedPropertyForDocs && error && (<p className="text-red-600 p-4">Could not load property details for document management.</p>)}
                                        </div>
                                    </DialogPanel>
                                </TransitionChild>
                            </div>
                        </div>
                    </Dialog>
                </Transition>

                <Transition show={isAssignMarketerModalOpen} as={Fragment}>
                    <Dialog as="div" className="relative z-40" onClose={() => setIsAssignMarketerModalOpen(false)}>
                        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black/30 backdrop-blur-sm" /></TransitionChild>
                        <div className="fixed inset-0 overflow-y-auto">
                            <div className="flex min-h-full items-center justify-center p-4 text-center">
                                <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                    <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                                        <DialogTitle as="h3" className="text-lg font-medium leading-6 text-gray-900">Assign Marketer</DialogTitle>
                                        <div className="mt-4">
                                            <SearchableSelect
                                                label="Select Marketer"
                                                value={undefined}
                                                onChange={(adminId) => {
                                                    if (adminId) handleConfirmAssignMarketer(adminId as string);
                                                }}
                                                fetchOptions={async () => marketingAdmins.map(a => ({ value: a.user_id, label: `${a.full_name || a.email}` }))}
                                                placeholder="Search marketing admins..."
                                                required
                                            />
                                        </div>
                                        <div className="mt-6 flex justify-end">
                                            <button type="button" className={getSecondaryButtonClasses()} onClick={() => setIsAssignMarketerModalOpen(false)}>Cancel</button>
                                        </div>
                                    </DialogPanel>
                                </TransitionChild>
                            </div>
                        </div>
                    </Dialog>
                </Transition>
            </div>
        </>
    );
}

export default Properties;