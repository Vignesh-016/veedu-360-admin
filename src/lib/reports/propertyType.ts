import { Database, Json as DbJson } from '../../database.types';
import {
    PropertyType as DbPropertyType,
    ListingType as DbListingType,
    AreaUnit as DbAreaUnit,
    SubmitterType as DbSubmitterType,
    AvailabilityStatus as DbAvailabilityStatus,
    ProximityUnit as DbProximityUnit,
    PropertyAdminStatus,
    InteractionStatus,
    RentStatus,
    TicketCategory,
    TicketPriority,
    TicketStatus,
} from '../types';

// --- Base User Structure for Denormalized Data ---
export interface ReportBaseUser { // User for nested objects like uploaded_by, raised_by, tenant, landlord
    id: string; // user_id or admin_id
    name: string | null;
    email: string | null;
}

// --- Full User Details Structure (for top-level submitter/tenant) ---
export interface ReportUserDetails extends ReportBaseUser {
    phone: string | null;
    visit_balance: number | null; // From customers table
    expiry_date: string | null;   // From customers table
    profile_details: DbJson | null; // From customers table, using DbJson for flexibility
    created_at: string;         // auth.users.created_at
    updated_at: string | null;  // auth.users.updated_at
}

// --- 1. `images` JSONB field ---
// Type: Array of ReportPropertyImageDetail
export interface ReportPropertyImageDetail {
    image_id: string;
    image_url: string;
    description: string | null;
    display_order: number;
    is_internal_image: boolean;
    uploaded_by: ReportBaseUser | null; // Admin who uploaded
    created_at: string; // property_images.created_at
}

// --- 2. `property_documents` JSONB field --- (NEW)
// Type: Array of ReportPropertyDocumentDetail
export interface ReportPropertyDocumentDetail {
    document_id: string;
    document_type: string;
    document_url: string;
    file_name: string | null;
    description: string | null;
    uploaded_by_name: string | null; // Direct name from SQL
    uploaded_at: string;
}

// --- 3. `submitter` JSONB field ---
// Type: ReportSubmitterDetail (which is ReportUserDetails | null)
export type ReportSubmitterDetail = ReportUserDetails | null;

// --- 4. `tenant` JSONB field ---
// Type: ReportTenantDetail (which is ReportUserDetails | null)
export type ReportTenantDetail = ReportUserDetails | null;

// --- 5. `management_plan` JSONB field ---
// Type: ReportManagementPlan (which is ReportManagementPlanDetail | null)
export interface ReportManagementPlanDetail {
    plan_id: string;
    name: string;
    percentage: number;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export type ReportManagementPlan = ReportManagementPlanDetail | null;

// --- 6. `owner_contact_assignment` JSONB field --- (NEW)
// Type: ReportOwnerContactAssignmentInfo | null
export interface ReportOwnerContactAssignmentInfo {
    assigned_admin_id: string;
    assigned_admin_name: string | null;
    assigned_at: string;
}

// --- 7. `marketing_assignment` JSONB field --- (NEW)
// Type: ReportMarketingAssignmentInfo | null
export interface ReportMarketingAssignmentInfo {
    assigned_admin_id: string;
    assigned_admin_name: string | null;
    assigned_at: string;
}

// --- 8. `customer_interactions` JSONB field ---
// Type: Array of ReportPropertyInteractionDetail
export interface ReportPropertyInteractionDetail {
    interaction_id: string;
    user: ReportBaseUser; // Customer who interacted
    assigned_sales_admin: ReportBaseUser | null; // Sales admin assigned to this interaction
    status: InteractionStatus;
    created_at: string;
    scheduled_for: string | null;
    visited_at: string | null;
    admin_notes: string | null;
}

// --- 9. `rent_records` JSONB field ---
// Type: Array of ReportPropertyRentRecordDetail
export interface ReportPropertyRentRecordDetail {
    rent_record_id: string;
    tenant: ReportBaseUser;
    landlord: ReportBaseUser;
    due_date: string;
    period_start_date: string;
    period_end_date: string;
    amount_due: number;
    amount_paid: number;
    status: RentStatus;
    notes: string | null;
    created_at: string;
}

// --- 10. `tickets` JSONB field ---
// Type: Array of ReportPropertyTicketDetail
// Nested image/comment structures for tickets
interface ReportTicketImageDetail {
    image_id: string;
    ticket_id: number;
    image_url: string;
    description: string | null;
    uploaded_by: string; // User ID (could be customer or admin)
    created_at: string;
}

interface ReportTicketCommentDetail {
    comment_id: number;
    ticket_id: number;
    comment_text: string;
    is_internal: boolean;
    user_id: string; // User ID (could be customer or admin)
    created_at: string;
}

export interface ReportPropertyTicketDetail {
    ticket_id: number;
    raised_by: ReportBaseUser; // User who raised the ticket
    subject: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
    status: TicketStatus;
    assigned_vendor: {
        vendor_id: string;
        company_name: string | null; // vendor company name
    } | null;
    assigned_support_admin: ReportBaseUser | null; // Admin assigned to support
    resolution_notes: string | null;
    created_at: string;
    images: ReportTicketImageDetail[];
    comments: ReportTicketCommentDetail[];
}


// --- Main Interface for the get_full_property_details_admin Function Output ---
// This directly maps to the columns returned by the SQL function
export type FullPropertyDetailsAdminData = Omit<
    Database['public']['Functions']['get_full_property_details_admin']['Returns'][0],
    // List all JSONB fields that need specific typing
    'images' |
    'property_documents' |
    'submitter' |
    'tenant' |
    'management_plan' |
    'owner_contact_assignment' |
    'marketing_assignment' |
    'customer_interactions' |
    'rent_records' |
    'tickets'
> & {
    // Core property fields (already typed by Omit if names match DB columns)
    // Explicitly list them if there are any discrepancies or for clarity
    property_id: string; // UUID
    property_type: DbPropertyType;
    listing_type: DbListingType;
    price: number; // decimal
    area: number; // decimal
    area_unit: DbAreaUnit;
    description: string | null;
    details: DbJson | null;
    locality: string;
    city: string;
    address: string;
    pincode: number | null; // New
    youtube_url: string | null;
    latitude: number | null; // decimal
    longitude: number | null; // decimal
    year_built: number | null;
    nearest_hospital: number | null; // decimal
    nearest_busstop: number | null; // decimal
    nearest_gym: number | null; // decimal
    nearest_park: number | null; // decimal
    nearest_school: number | null; // decimal
    nearest_swimmingpool: number | null; // decimal
    proximity_unit: DbProximityUnit | null;
    admin_notes: string | null;
    inventory_details: DbJson | null;
    admin_status: PropertyAdminStatus; // Renamed, new enum
    is_listed: boolean; // New
    is_featured: boolean;
    is_exclusive: boolean;
    advance_amount: number | null; // New, decimal
    rent_due_day: number | null;
    submitter_type: DbSubmitterType | null;
    submitter_notes: string | null;
    submitted_at: string | null; // timestamptz
    availability_status: DbAvailabilityStatus | null;
    can_reachout: boolean;
    created_at: string; // timestamptz
    updated_at: string; // timestamptz

    // Typed JSONB fields
    images: ReportPropertyImageDetail[];
    property_documents: ReportPropertyDocumentDetail[];
    submitter: ReportSubmitterDetail; // This is ReportUserDetails | null
    tenant: ReportTenantDetail;       // This is ReportUserDetails | null
    management_plan: ReportManagementPlan; // This is ReportManagementPlanDetail | null
    owner_contact_assignment: ReportOwnerContactAssignmentInfo | null;
    marketing_assignment: ReportMarketingAssignmentInfo | null;
    customer_interactions: ReportPropertyInteractionDetail[];
    rent_records: ReportPropertyRentRecordDetail[];
    tickets: ReportPropertyTicketDetail[];
};