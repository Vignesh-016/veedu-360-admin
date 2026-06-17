// src/lib/types.ts
import { Database, Json } from '../database.types';

// --- Core Enums from Database ---
export type PropertyType = Database['public']['Enums']['property_type_enum'];
export type ListingType = Database['public']['Enums']['listing_type_enum'];
export type AreaUnit = Database['public']['Enums']['area_unit_enum'];
export type Direction = Database['public']['Enums']['direction_enum'];
export type HouseType = Database['public']['Enums']['house_type_enum'];
export type LandType = Database['public']['Enums']['land_type_enum'];
export type BuildingType = Database['public']['Enums']['building_type_enum'];
export type FurnishedStatus = Database['public']['Enums']['furnished_status_enum'];
export type SubmitterType = Database['public']['Enums']['submitter_type_enum'];
export type AvailabilityStatus = Database['public']['Enums']['availability_status_enum'];
export type ProximityUnit = Database['public']['Enums']['proximity_unit_enum'];
export type WaterSource = Database['public']['Enums']['water_source_enum'];
export type PowerBackup = Database['public']['Enums']['power_backup_enum'];
export type RentStatus = Database['public']['Enums']['rent_status_enum'];
export type TicketStatus = Database['public']['Enums']['ticket_status_enum'];
export type TicketCategory = Database['public']['Enums']['ticket_category_enum'];
export type TicketPriority = Database['public']['Enums']['ticket_priority_enum'];
export type VendorStatus = Database['public']['Enums']['vendor_status_enum'];
export type ServiceCategory = Database['public']['Enums']['service_category_enum'];
export type AdminRole = Database['public']['Enums']['admin_role_enum'];
export type PropertyAdminStatus = Database['public']['Enums']['property_admin_status_enum'];
export type InteractionStatus = Database['public']['Enums']['interaction_status_enum'];
export type RentalApplicationStatus = Database['public']['Enums']['rental_application_status_enum'];

// --- Image & Document Structures ---
export interface PropertyImage {
    image_id: string;
    image_url: string;
    description: string | null;
    display_order: number;
    is_internal_image: boolean;
    uploaded_by_name: string | null;
    uploaded_at?: string;
}

export interface TicketImage {
    image_id: string;
    image_url: string;
    description: string | null;
    uploaded_by_name: string | null;
    created_at: string;
}

export interface PropertyDocument {
    document_id: string;
    document_type: string;
    document_url: string;
    file_name: string | null;
    description: string | null;
    uploaded_by_name: string | null;
    uploaded_at: string;
}

export interface CustomerDocument {
    document_id: string;
    document_type: string;
    document_url: string;
    file_name: string | null;
    description: string | null;
    uploaded_by_name: string | null;
    uploaded_at: string;
}


// --- User, Admin, Customer, Tenant Info Structures ---
export interface BaseUserInfo {
    user_id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
}

export interface CustomerProfile extends BaseUserInfo {
    visit_balance: number | null;
    expiry_date: string | null;
    profile_details: Json | null;
    auth_created_at: string;
    customer_updated_at: string | null;
}

export interface AdminUser extends BaseUserInfo {
    roles: AdminRole[];
    served_pincodes: number[] | null;
    is_active: boolean;
    admin_created_at: string;
    admin_updated_at: string;
    auth_user_created_at: string;
}

export type AdminUserSummary = Omit<Database['public']['Functions']['list_admins']['Returns'][0], 'user_id' | 'created_at' | 'updated_at'> & {
    user_id: string;
    created_at: string;
    updated_at: string;
};


// --- Property Type Details (for property.details JSONB field) ---
export interface HouseDetailsJson {
    house_name: string;
    house_type?: HouseType;
    num_bedrooms?: number;
    num_bathrooms?: number;
    num_balconies?: number;
    total_floors?: number;
    floor_number?: number;
    num_carparking?: number;
    furnished_status?: FurnishedStatus;
    facing_direction?: Direction;
    is_corner_plot?: boolean;
    water_source?: WaterSource;
    power_backup?: PowerBackup;
    lift_facility_available?: boolean;
}

export interface LandDetailsJson {
    land_name: string;
    land_type?: LandType;
    plot_dimensions?: string;
    road_access_width_ft?: number;
    is_corner_plot?: boolean;
}

export interface BuildingDetailsJson {
    building_name: string;
    building_type?: BuildingType;
    total_floors?: number;
    num_units?: number;
    available_units?: number;
    common_amenities?: string[];
}

// --- Management & Visit Plan Info ---
export type ManagementPlanInfo = Database['public']['Functions']['list_management_plans_admin']['Returns'][0]

export type VisitPlanAdminView = Database['public']['Functions']['get_all_visit_plans_admin']['Returns'][0]

// --- Property Admin View Types ---
// Base property fields common to summary and details
interface PropertyCore {
    property_id: string;
    property_type: PropertyType;
    listing_type: ListingType;
    price: number;
    advance_amount: number | null;
    area: number;
    area_unit: AreaUnit;
    year_built: number | null;
    description: string | null;
    details: Json;
    youtube_url: string | null;
    locality: string;
    city: string;
    address: string;
    pincode: number | null;
    latitude: number | null;
    longitude: number | null;
    admin_notes: string | null;
    inventory_details: Json;
    admin_status: PropertyAdminStatus;
    is_listed: boolean;
    is_featured: boolean;
    is_exclusive: boolean;
    rent_due_day: number | null;
    submitter_type: SubmitterType | null;
    submitter_notes: string | null;
    submitted_at: string | null;
    availability_status: AvailabilityStatus | null;
    can_reachout: boolean;
    property_name: string | null;
    created_at: string;
    updated_at: string;
}

// For get_properties_admin (list view)
export interface AdminPropertySummary extends PropertyCore {
    property_images: PropertyImage[];
    submitter_info: BaseUserInfo | null;
    tenant_info: BaseUserInfo | null;
    management_plan_info: {
        plan_id: string;
        name: string;
        percentage: number;
    } | null;
    owner_contact_assigned_admin_id: string | null;
    owner_contact_assigned_admin_name: string | null;
    owner_contact_assigned_at: string | null;
    marketing_assigned_admin_id: string | null;
    marketing_assigned_admin_name: string | null;
    marketing_assigned_at: string | null;
    total_count: number;
}

// For get_property_details_admin
export interface OwnerContactAssignmentInfo {
    assigned_admin_id: string;
    assigned_admin_name: string | null;
    assigned_at: string;
}
export interface MarketingAssignmentInfo extends OwnerContactAssignmentInfo { }

export interface AdminPropertyDetails extends PropertyCore {
    nearest_hospital: number | null;
    nearest_busstop: number | null;
    nearest_gym: number | null;
    nearest_park: number | null;
    nearest_school: number | null;
    nearest_swimmingpool: number | null;
    proximity_unit: ProximityUnit | null;
    property_images: PropertyImage[];
    property_documents: PropertyDocument[];
    submitter_info: BaseUserInfo | null;
    tenant_info: BaseUserInfo | null;
    management_plan_info: {
        plan_id: string;
        name: string;
        percentage: number;
    } | null;
    owner_contact_assignment: OwnerContactAssignmentInfo | null;
    marketing_assignment: MarketingAssignmentInfo | null;
}


// --- Customer (User) Admin View Types ---
export type CustomerSearchResultAdmin = Database['public']['Functions']['search_customers_admin']['Returns'][0];
export interface DenormalizedCustomerInteraction {
    interaction_id: string;
    property_id: string;
    property_address: string | null;
    property_locality: string | null;
    status: InteractionStatus;
    assigned_tenant_telecaller_name: string | null;
    assigned_sales_admin_name: string | null;
    created_at: string;
    scheduled_for: string | null;
    visited_at: string | null;
    admin_notes: string | null;
}

export interface DenormalizedOwnedPropertySummary {
    property_id: string;
    property_type: PropertyType;
    listing_type: ListingType;
    price: number;
    address: string | null;
    locality: string | null;
    city: string | null;
    pincode: number | null;
    admin_status: PropertyAdminStatus;
    is_listed: boolean;
    images: PropertyImage[];
    tenant_info: BaseUserInfo | null;
}

export interface DenormalizedTenantInPropertySummary {
    property_id: string;
    property_type: PropertyType;
    listing_type: ListingType;
    price: number;
    address: string | null;
    locality: string | null;
    city: string | null;
    pincode: number | null;
    admin_status: PropertyAdminStatus;
    is_listed: boolean;
    owner_details: BaseUserInfo | null;
    images: PropertyImage[];
}

export interface DenormalizedCustomerTransaction {
    transaction_id: string;
    plan_name: string | null;
    amount: number;
    status: string;
    created_at: string;
}

export interface DenormalizedCustomerTicketSummary {
    ticket_id: number;
    property_id: string;
    property_address: string | null;
    subject: string;
    category: TicketCategory;
    priority: TicketPriority;
    status: TicketStatus;
    created_at: string;
}

export interface DenormalizedLandlordRentRecord {
    rent_record_id: string;
    property_id: string;
    property_address: string | null;
    tenant_name: string | null;
    tenant_email: string | null;
    tenant_phone: string | null;
    due_date: string;
    period_start_date: string;
    period_end_date: string;
    amount_due: number;
    amount_paid: number;
    status: RentStatus;
}

export interface DenormalizedTenantRentRecord {
    rent_record_id: string;
    property_id: string;
    property_address: string | null;
    landlord_name: string | null;
    landlord_email: string | null;
    landlord_phone: string | null;
    due_date: string;
    period_start_date: string;
    period_end_date: string;
    amount_due: number;
    amount_paid: number;
    status: RentStatus;
}


export type CustomerFullDetailsAdmin = Omit<Database['public']['Functions']['get_customer_full_details_admin']['Returns'][0],
    'customer_documents' |
    'interactions' |
    'owned_properties' |
    'tenant_in_properties' |
    'transactions' |
    'raised_tickets' |
    'landlord_rent_records' |
    'tenant_rent_records'
> & {
    customer_documents: CustomerDocument[];
    interactions: DenormalizedCustomerInteraction[];
    owned_properties: DenormalizedOwnedPropertySummary[];
    tenant_in_properties: DenormalizedTenantInPropertySummary[];
    transactions: DenormalizedCustomerTransaction[];
    raised_tickets: DenormalizedCustomerTicketSummary[];
    landlord_rent_records: DenormalizedLandlordRentRecord[];
    tenant_rent_records: DenormalizedTenantRentRecord[];
};


// --- Interaction Admin View Type ---
export type CustomerInteractionAdminView = Database['public']['Functions']['get_all_customer_interactions_admin']['Returns'][0];


// --- Transaction Admin View Type ---
export type TransactionAdminView = Database['public']['Functions']['get_all_transactions_admin']['Returns'][0];


// --- Service & Vendor Admin View Types ---
export type ServiceAdminView = Database['public']['Functions']['list_services_admin']['Returns'][0];

export type VendorAdminSummary = Database['public']['Functions']['list_vendors_admin']['Returns'][0];

export type VendorAdminDetails = Omit<Database['public']['Functions']['get_vendor_details_admin']['Returns'][0], 'services'> & {
    services: Array<{ service_id: number; service_name: string; category: ServiceCategory | null }>;
};


// --- Rent Management Admin View Types ---
export type RentRecordAdminSummary = Database['public']['Functions']['list_rent_records_admin']['Returns'][0];

export interface RentPaymentAdminView {
    payment_id: string;
    paid_by_name: string | null;
    amount: number;
    payment_date: string;
    payment_method: string | null;
    transaction_ref: string | null;
    notes: string | null;
}
export type RentRecordAdminDetails = Omit<Database['public']['Functions']['get_rent_record_details_admin']['Returns'][0], 'payments'> & {
    payments: RentPaymentAdminView[];
};


// --- Ticket Admin View Types ---
export type TicketAdminSummary = Database['public']['Functions']['list_tickets_admin']['Returns'][0];

export interface TicketCommentAdminView {
    comment_id: number;
    user_id: string;
    user_name: string | null;
    user_is_admin: boolean;
    comment_text: string;
    is_internal: boolean;
    created_at: string;
}
export type TicketAdminDetails = Omit<Database['public']['Functions']['get_ticket_details_admin']['Returns'][0], 'images' | 'comments'> & {
    images: TicketImage[];
    comments: TicketCommentAdminView[];
};


// --- Dashboard Stats Types (Reflecting get_dashboard_stats_admin output) ---
export interface DashboardPropertyStats {
    total_properties: number;
    publicly_listed_properties: number;
    properties_by_admin_status: Record<PropertyAdminStatus, number> | {};
    rental_properties_is_listed: number;
    sale_properties_is_listed: number;
    occupied_rentals: number;
    properties_by_type: Record<PropertyType, number> | {};
}
export interface DashboardAdminStaffStats {
    total_admin_staff: number;
    active_admin_staff: number;
    admin_staff_by_role: Record<AdminRole, number> | {};
}
export interface DashboardCustomerStats {
    total_registered_users: number;
    customers_with_profiles: number;
    customers_with_active_visits: number;
}
export interface DashboardInteractionStats {
    total_interactions: number;
    interactions_by_status: Record<InteractionStatus, number> | {};
}
export interface DashboardVisitTransactionStats {
    total_transactions: number;
    successful_transactions: number;
    total_revenue_from_visits: number;
}
export interface DashboardServiceStats {
    total_services: number;
    services_by_category: Record<ServiceCategory, number> | {};
}
export interface DashboardVendorStats {
    total_vendors: number;
    vendors_by_status: Record<VendorStatus, number> | {};
}
export interface DashboardTicketStats {
    total_tickets: number;
    tickets_by_status: Record<TicketStatus, number> | {};
    tickets_by_priority: Record<TicketPriority, number> | {};
    assigned_to_admin_tickets: number;
    assigned_to_vendor_tickets: number;
    unassigned_open_tickets: number;
}
export interface DashboardRentStats {
    total_rent_records: number;
    rent_records_by_status: Record<RentStatus, number> | {};
    total_rent_amount_due_outstanding: number;
    total_rent_collected_ever: number;
}
export interface DashboardManagementPlanStats {
    total_mgmt_plans: number;
    active_mgmt_plans: number;
}
export interface DashboardVisitPlanStats {
    total_visit_plans: number;
    active_visit_plans: number;
}

export interface DashboardStats {
    properties: DashboardPropertyStats | null;
    admin_staff: DashboardAdminStaffStats | null;
    customers: DashboardCustomerStats | null;
    interactions: DashboardInteractionStats | null;
    visit_transactions: DashboardVisitTransactionStats | null;
    services: DashboardServiceStats | null;
    vendors: DashboardVendorStats | null;
    tickets: DashboardTicketStats | null;
    rent_records: DashboardRentStats | null;
    management_plans: DashboardManagementPlanStats | null;
    visit_plans: DashboardVisitPlanStats | null;
}

// --- Team Assignment Workflow Types ---
export interface AssignableOwnerContactProperty {
    property_id: string;
    address: string | null;
    locality: string | null;
    city: string | null;
    pincode: number | null;
    submitter_name: string | null;
    submitter_phone: string | null;
    submitted_at: string;
    total_count: number;
}

export interface AssignableMarketingProperty {
    property_id: string;
    address: string | null;
    locality: string | null;
    city: string | null;
    pincode: number | null;
    submitter_name: string | null;
    owner_verified_at: string;
    total_count: number;
}

export interface AssignableTenantContactInteraction {
    interaction_id: string;
    property_id: string;
    property_address: string | null;
    property_locality: string | null;
    customer_user_id: string;
    customer_name: string | null;
    customer_phone: string | null;
    customer_email: string | null;
    requested_visit_time: string | null;
    interaction_created_at: string;
    total_count: number;
}

export interface SalesVisitPropertyInfo {
    interaction_id: string;
    property_id: string;
    address: string | null;
    locality: string | null;
    pincode: number | null;
    property_type: PropertyType;
    latitude: number | null;
    longitude: number | null;
    interaction_status: InteractionStatus;
    scheduled_for_time: string;
    owner_name: string | null;
    owner_phone: string | null;
}
export interface SalesVisitAssignmentView {
    visit_assignment_id: string;
    customer_user_id: string;
    customer_name: string | null;
    customer_phone: string | null;
    customer_email: string | null;
    property_visits: SalesVisitPropertyInfo[];
}

// --- Parameter Types for Admin Functions ---
export type GetPropertiesAdminParams = Database['public']['Functions']['get_properties_admin']['Args'];
export type InsertPropertyAdminParams = Database['public']['Functions']['insert_property_admin']['Args'];
export type UpdatePropertyAdminParams = Database['public']['Functions']['update_property_admin']['Args'];
export type RecordPropertyImageUploadAdminParams = Database['public']['Functions']['record_property_image_upload_admin']['Args'];
export type UpdatePropertyImageAdminParams = Database['public']['Functions']['update_property_image_admin']['Args'];
export type RecordPropertyDocumentUploadAdminParams = Database['public']['Functions']['record_property_document_upload_admin']['Args'];
export type RecordCustomerDocumentUploadAdminParams = Database['public']['Functions']['record_customer_document_upload_admin']['Args'];


export type UpdateCustomerProfileDetailsAdminParams = Database['public']['Functions']['update_customer_profile_details_admin']['Args'];
export type GetAllCustomerInteractionsAdminParams = Database['public']['Functions']['get_all_customer_interactions_admin']['Args'];
export type UpdateCustomerInteractionAdminParams = Database['public']['Functions']['update_customer_interaction_admin']['Args'];

export type InsertVisitPlanAdminParams = Database['public']['Functions']['insert_visit_plan_admin']['Args'];
export type UpdateVisitPlanAdminParams = Database['public']['Functions']['update_visit_plan_admin']['Args'];
export type GetAllTransactionsAdminParams = Database['public']['Functions']['get_all_transactions_admin']['Args'];
export type UpdateTransactionStatusAdminParams = Database['public']['Functions']['update_transaction_status_admin']['Args'];

export type CreateManagementPlanAdminParams = Database['public']['Functions']['create_management_plan_admin']['Args'];
export type UpdateManagementPlanAdminParams = Database['public']['Functions']['update_management_plan_admin']['Args'];

export type CreateRentRecordAdminParams = Database['public']['Functions']['create_rent_record_admin']['Args'];
export type UpdateRentRecordAdminParams = Database['public']['Functions']['update_rent_record_admin']['Args'];
export type ListRentRecordsAdminParams = Database['public']['Functions']['list_rent_records_admin']['Args'];
export type RecordRentPaymentAdminParams = Database['public']['Functions']['record_rent_payment_admin']['Args'];
export type OccupiedPropertiesRentStatusReportAdminParams = Database['public']['Functions']['get_occupied_properties_rent_status_report_admin']['Args'];
export type OccupiedPropertiesRentStatusReportAdminResults = Database['public']['Functions']['get_occupied_properties_rent_status_report_admin']['Returns'];
export type PropertyPaymentHistoryAdminParams = Database['public']['Functions']['get_property_payment_history_landlord']['Args'];
export type PropertyPaymentHistoryAdminResults = Database['public']['Functions']['get_property_payment_history_landlord']['Returns'];

export type ListTicketsAdminParams = Database['public']['Functions']['list_tickets_admin']['Args'];
export type UpdateTicketDetailsAdminParams = Database['public']['Functions']['update_ticket_details_admin']['Args'];
export type AssignTicketAdminParams = Database['public']['Functions']['assign_ticket_admin']['Args'];
export type AssignTicketToVendorAdminParams = Database['public']['Functions']['assign_ticket_to_vendor_admin']['Args'];
export type AddTicketCommentAdminParams = Database['public']['Functions']['add_ticket_comment_admin']['Args'];
export type RecordTicketImageUploadAdminParams = Database['public']['Functions']['record_ticket_image_upload_admin']['Args'];

export type CreateServiceAdminParams = Database['public']['Functions']['create_service_admin']['Args'];
export type UpdateServiceAdminParams = Database['public']['Functions']['update_service_admin']['Args'];
export type ListServicesAdminParams = Database['public']['Functions']['list_services_admin']['Args'];
export type CreateVendorAdminParams = Database['public']['Functions']['create_vendor_admin']['Args'];
export type UpdateVendorAdminParams = Database['public']['Functions']['update_vendor_admin']['Args'];
export type ListVendorsAdminParams = Database['public']['Functions']['list_vendors_admin']['Args'];

export type AssignPropertyToOwnerTelecallerParams = Database['public']['Functions']['assign_property_to_owner_telecaller_admin']['Args'];
export type MarkPropertyOwnerVerifiedParams = Database['public']['Functions']['mark_property_owner_verified_admin']['Args'];
export type AssignPropertyToMarketerParams = Database['public']['Functions']['assign_property_to_marketer_admin']['Args'];
export type MarkPropertyMarketingVerifiedParams = Database['public']['Functions']['mark_property_marketing_verified_admin']['Args'];
export type SetPropertyListingStatusParams = Database['public']['Functions']['set_property_listing_status_admin']['Args'];

export type AssignInteractionToTenantTelecallerParams = Database['public']['Functions']['assign_interaction_to_tenant_telecaller_admin']['Args'];
export type MarkInteractionTenantVerifiedParams = Database['public']['Functions']['mark_interaction_tenant_verified_admin']['Args'];

export type MarkInteractionVisitCompletedSalesParams = Database['public']['Functions']['mark_interaction_visit_completed_sales_admin']['Args'];
export type MarkInteractionVisitCancelledSalesParams = Database['public']['Functions']['mark_interaction_visit_cancelled_sales_admin']['Args'];

export type AddAdminRoleParams = Database['public']['Functions']['add_admin_role']['Args'];
export type SetAdminRolesParams = Database['public']['Functions']['set_admin_roles']['Args'];
export type UpdateAdminPincodesParams = Database['public']['Functions']['update_admin_pincodes']['Args'];

export type TelecallingOwnerTeamPerformanceParams = Database['public']['Functions']['get_telecalling_owner_team_performance_admin']['Args'];
export type SalesTeamPerformanceParams = Database['public']['Functions']['get_sales_team_performance_admin']['Args'];
export type TicketHandlingPerformanceParams = Database['public']['Functions']['get_ticket_handling_performance_admin']['Args'];

export interface UploadDocumentResponse {
    document_id: string;
    document_url: string;
    file_name: string | null;
    document_type: string;
}

export interface UploadPropertyImageResponse {
    image_id: string;
    image_url: string;
}

export type RentalApplicationData = {
    move_in_date: string;
    num_occupants: number;
    applicant_notes?: string;
} & Json;

export type AdminGetRentalApplicationsParams = Database['public']['Functions']['admin_get_rental_applications']['Args'];
export type AdminUpdateRentalApplicationStatusParams = Database['public']['Functions']['admin_update_rental_application_status']['Args'];
export type AdminAddRentalApplicationNoteParams = Database['public']['Functions']['admin_add_rental_application_note']['Args'];
export type AdminAssignRentalApplicationParams = Database['public']['Functions']['admin_assign_rental_application']['Args'];

export type RentalApplicationAdminView = Omit<Database['public']['Functions']['admin_get_rental_applications']['Returns'][0], 'application_data'> & {
    'application_data': RentalApplicationData
};
export type AdminGetRentalApplicationsResults = RentalApplicationAdminView[];
export type RentalApplicationAdminDetails = Omit<Database['public']['Functions']['admin_get_rental_application_details']['Returns'][0], 'application_data'> & {
    'application_data': RentalApplicationData
};
export type AdminGetRentalApplicationDetailsResults = RentalApplicationAdminDetails[];

// --- Homepage Settings Types ---
export interface HeroSettings {
    title: string;
    bg_image: string;
}

export interface FeaturedPropertiesSettings {
    title: string;
    limit: number;
}

export interface PromoSettings {
    tag: string;
    title: string;
    description: string;
    bg_image: string;
    btn_text: string;
    btn_link: string;
}

export interface FeatureItem {
    icon: string;
    title: string;
    description: string;
}

export interface WhyChooseUsSettings {
    title: string;
    subtitle: string;
    bg_image: string;
    features: FeatureItem[];
}

export interface ManagementServicesSettings {
    title: string;
    subtitle: string;
}

export interface TestimonialItem {
    name: string;
    rating: number;
    avatar: string;
    comment: string;
}

export interface TestimonialsSettings {
    title: string;
    subtitle: string;
    list: TestimonialItem[];
}

export interface SupportContactInfo {
    title: string;
    subtitle: string;
    link: string;
}

export interface SupportSettings {
    whatsapp: SupportContactInfo;
    call: SupportContactInfo;
    email: SupportContactInfo;
}

export interface HomepageSettings {
    hero: HeroSettings;
    featured_properties: FeaturedPropertiesSettings;
    plots_promo: PromoSettings;
    houses_promo: PromoSettings;
    why_choose_us: WhyChooseUsSettings;
    management_services: ManagementServicesSettings;
    testimonials: TestimonialsSettings;
    support: SupportSettings;
}