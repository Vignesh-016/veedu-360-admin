import {
    AreaUnit, HouseType, FurnishedStatus, LandType,
    BuildingType, Direction, ListingType, PropertyType,
    InteractionStatus, SubmitterType, AvailabilityStatus,
    ProximityUnit, WaterSource, PowerBackup,
    VendorStatus, ServiceCategory, TicketPriority, TicketStatus,
    RentStatus, TicketCategory as AdminTicketCategory,
    PropertyAdminStatus, AdminRole, RentalApplicationStatus
} from './types';

type EnumMap<T extends string> = Record<T, string>;

export const areaUnitMap: EnumMap<AreaUnit> = { SQ_FT: 'sq.ft', CENTS: 'cents', ACRES: 'acres' };
export const houseTypeMap: EnumMap<HouseType> = { APARTMENT_FLAT: 'Apartment', INDEPENDENT_VILLA: 'House/Villa', HOSTEL_PG: 'Hostel/PG' };
export const furnishedStatusMap: EnumMap<FurnishedStatus> = { UNFURNISHED: 'Unfurnished', SEMI_FURNISHED: 'Semi-Furnished', FULLY_FURNISHED: 'Furnished' };
export const landTypeMap: EnumMap<LandType> = { RESIDENTIAL: 'Residential', COMMERCIAL: 'Commercial', AGRICULTURAL: 'Agricultural' };
export const buildingTypeMap: EnumMap<BuildingType> = { OFFICE: 'Office', WAREHOUSE: 'Warehouse', RETAIL: 'Retail', INDUSTRIAL: 'Industrial', HOSPITALITY: 'Hospitality' };
export const directionMap: EnumMap<Direction> = { NORTH: 'North', SOUTH: 'South', EAST: 'East', WEST: 'West' };
export const listingTypeMap: EnumMap<ListingType> = { SALE: 'For Sale', RENTAL: 'For Rent' };
export const propertyTypeMap: EnumMap<PropertyType> = { HOUSE: 'House', LAND: 'Land', BUILDING: 'Building' };
export const propertyAdminStatusMap: EnumMap<PropertyAdminStatus> = { SUBMITTED: 'Submitted', OWNER_CONTACT_PENDING: 'Owner Contact Pending', OWNER_VERIFIED: 'Owner Verified by telecalling', MARKETING_VISIT_PENDING: 'Marketing Visit Pending', MARKETING_VERIFIED: 'Verified by Marketing', AWAITING_LISTING: 'Awaiting Listing', REJECTED: 'Rejected', SUSPENDED: 'Suspended', RENTED: 'Rented', SOLD: 'Sold' }
export const interactionStatusMap: EnumMap<InteractionStatus> = {
    WISHLISTED: 'Wishlisted',
    VISIT_PENDING: 'Visit Pending',
    VISIT_CONFIRMED_PENDING_SALES: 'Waiting from Sales',
    VISIT_SCHEDULED_WITH_SALES: 'Visit Scheduled w. Sales',
    VISIT_COMPLETED: 'Visit Completed',
    VISIT_CANCELLED: 'Visit Cancelled',
    RENTAL_APPLICATION_SUBMITTED: 'Application Submitted',
    LEASE_CONVERTED: 'Lease Finalized'
};
export const submitterTypeMap: EnumMap<SubmitterType> = { AGENT: 'Agent', OWNER: 'Owner', BUILDER: 'Builder' };
export const availabilityStatusMap: EnumMap<AvailabilityStatus> = { UNDER_CONSTRUCTION: 'Under Construction', READY_TO_MOVE: 'Ready to Move' };
export const proximityUnitMap: EnumMap<ProximityUnit> = { KM: 'km', METERS: 'm', MINUTES_WALK: 'min walk', MINUTES_DRIVE: 'min drive' };
export const waterSourceMap: EnumMap<WaterSource> = { BOREWELL: 'Borewell', MUNICIPAL: 'Municipal Supply', BOTH: 'Both' };
export const powerBackupMap: EnumMap<PowerBackup> = { NONE: 'None', PARTIAL: 'Partial', FULL: 'Full' };
export const vendorStatusMap: EnumMap<VendorStatus> = { ACTIVE: 'Active', INACTIVE: 'Inactive', UNDER_REVIEW: 'Under Review' };
export const serviceCategoryMap: EnumMap<ServiceCategory> = { MAINTENANCE: 'Maintenance', REPAIR: 'Repair', CONSTRUCTION: 'Construction', DESIGN: 'Design', CLEANING: 'Cleaning', SECURITY: 'Security', LANDSCAPING: 'Landscaping', POOL: 'Pool', PEST_CONTROL: 'Pest Control', UTILITIES: 'Utilities', OTHER: 'Other' };
export const ticketPriorityMap: EnumMap<TicketPriority> = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' };

export const ticketStatusMap: EnumMap<TicketStatus> = {
    NEW: 'New',
    OPEN: 'Open',
    ASSIGNED: 'Assigned',
    WAITING_TENANT_RESPONSE: 'Waiting Tenant',
    WAITING_OWNER_RESPONSE: 'Waiting Owner',
    IN_PROGRESS: 'In Progress',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
    CANCELLED: 'Cancelled'
};

export const rentStatusMap: EnumMap<RentStatus> = {
    DUE: 'Due',
    PAID: 'Paid',
    PARTIALLY_PAID: 'Partially Paid',
    OVERDUE: 'Overdue',
    CANCELLED: 'Cancelled',
};

export const ticketCategoryMap: EnumMap<AdminTicketCategory> = {
    MAINTENANCE_REPAIR: 'Maintenance/Repair',
    PLUMBING: 'Plumbing',
    ELECTRICAL: 'Electrical',
    APPLIANCE: 'Appliance',
    CLEANING: 'Cleaning',
    LANDSCAPING: 'Landscaping',
    PEST_CONTROL: 'Pest Control',
    NOISE_COMPLAINT: 'Noise Complaint',
    LEASE_QUERY: 'Lease Query',
    PAYMENT_QUERY: 'Payment Query',
    GENERAL_INQUIRY: 'General Inquiry',
    OTHER: 'Other',
};

export const adminRoleMap: EnumMap<AdminRole> = {
    "super-admin": "Super Admin",
    "telecalling-owner-team": "Owner Telecalling",
    "marketing-team": "Marketing Team",
    "telecalling-tenant-team": "Tenant Telecalling",
    "sales-team": "Sales Team",
    "accounts-team": "Accounts Team"
};

export const rentalApplicationStatusMap: EnumMap<RentalApplicationStatus> = {
    SUBMITTED: 'Submitted',
    REVIEW_IN_PROGRESS: 'Review In Progress',
    AWAITING_LANDLORD_CONTACT: 'Awaiting Landlord Contact',
    LANDLORD_INFO_PENDING: 'Landlord Info Pending',
    LANDLORD_APPROVED: 'Landlord Approved',
    LANDLORD_REJECTED: 'Landlord Rejected',
    DOCUMENTS_REQUESTED: 'Documents Requested',
    DOCUMENTS_VERIFIED: 'Documents Verified',
    APPROVED_AWAITING_PAYMENT: 'Approved - Awaiting Payment',
    PAYMENT_CONFIRMED: 'Payment Confirmed',
    LEASE_FINALIZED: 'Lease Finalized',
    TENANCY_ACTIVE: 'Tenancy Active',
    APPLICATION_WITHDRAWN_CUSTOMER: 'Withdrawn by Customer',
    CANCELLED_ADMIN: 'Cancelled by Admin'
};

// Helper function
export function getDisplayValue<T extends string>(map: Record<T, string>, value: T | null | undefined, defaultValue: string = 'N/A'): string {
    return value && map.hasOwnProperty(value) ? map[value] : defaultValue;
}