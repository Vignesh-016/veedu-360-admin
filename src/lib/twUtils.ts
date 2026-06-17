import {
    InteractionStatus, PropertyType, ListingType, SubmitterType, PropertyAdminStatus,
    AvailabilityStatus, VendorStatus, TicketPriority, TicketStatus, RentStatus
} from "./types";

export const getBaseInputClasses = (options?: { hasError?: boolean; className?: string }) => {
    let baseClasses = "block w-full rounded-md shadow-sm sm:text-sm disabled:opacity-70 disabled:bg-gray-100 focus:ring-[#D9A619] focus:border-[#D9A619] h-10"; // Updated focus colors
    if (options?.hasError) {
        baseClasses += " border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500";
    } else {
        baseClasses += " border-gray-300";
    }
    if (options?.className) {
        baseClasses += ` ${options.className}`;
    }
    return baseClasses;
};

export const getPrimaryButtonClasses = (options?: { className?: string; disabled?: boolean }) => {
    let baseClasses = "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-[#D9A619] hover:bg-[#B58D13] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D9A619] transition-colors duration-150"; // Updated bg, hover, focus colors
    if (options?.disabled) {
        baseClasses += " opacity-50 cursor-not-allowed";
    }
    if (options?.className) {
        baseClasses += ` ${options.className}`;
    }
    return baseClasses;
};

export const getSecondaryButtonClasses = (options?: { className?: string; disabled?: boolean }) => {
    let baseClasses = "inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D9A619] transition-colors duration-150"; // Updated focus ring color
    if (options?.disabled) {
        baseClasses += " opacity-50 cursor-not-allowed";
    }
    if (options?.className) {
        baseClasses += ` ${options.className}`;
    }
    return baseClasses;
};

export const getDangerButtonClasses = (options?: { className?: string; disabled?: boolean }) => {
    let baseClasses = "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150";
    if (options?.disabled) {
        baseClasses += " opacity-50 cursor-not-allowed";
    }
    if (options?.className) {
        baseClasses += ` ${options.className}`;
    }
    return baseClasses;
};

export const getTertiaryButtonClasses = (options?: { className?: string; disabled?: boolean }) => {
    let baseClasses = "inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md text-[#D9A619] hover:text-[#B58D13] hover:bg-[#FEF7E0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D9A619] transition-colors duration-150"; // Updated text, hover text, hover bg, focus ring colors
    if (options?.disabled) {
        baseClasses += " opacity-50 cursor-not-allowed text-gray-400 hover:text-gray-400 hover:bg-transparent";
    }
    if (options?.className) {
        baseClasses += ` ${options.className}`;
    }
    return baseClasses;
};

export const getBaseCardClasses = (): string => {
    return `
        bg-white rounded-lg border border-gray-200 shadow-sm
        transition-shadow duration-200 ease-in-out hover:shadow-md
    `;
}

const badgeBaseClasses = `
    px-2.5 py-1 rounded-md text-[10px] font-medium inline-flex items-center gap-1.5
    border transition-all duration-200 uppercase tracking-normal
`;

const defaultBadgeClasses = `${badgeBaseClasses} bg-gray-100 text-gray-700 border-gray-200`;

export const getStatusBadgeClasses = (
    status: InteractionStatus | TicketStatus | RentStatus | PropertyAdminStatus | string | null | undefined
): string => {
    const base = badgeBaseClasses;
    switch (status) {
        // Interaction Statuses
        case 'WISHLISTED': return `${base} bg-purple-100 text-purple-800 border-purple-200`;
        case 'VISIT_PENDING': return `${base} bg-yellow-100 text-yellow-800 border-yellow-200`;
        case 'VISIT_APPROVED': return `${base} bg-blue-100 text-blue-800 border-blue-200`;
        case 'VISIT_COMPLETED': return `${base} bg-green-100 text-green-800 border-green-200`;
        case 'VISIT_CANCELLED': return `${base} bg-red-100 text-red-800 border-red-200`;

        // Property Admin Statuses
        case 'SUBMITTED': return `${base} bg-slate-50 text-slate-600 border-slate-200`;
        case 'OWNER_CONTACT_PENDING': return `${base} bg-orange-50 text-orange-600 border-orange-200 shadow-sm shadow-orange-100/50`;
        case 'OWNER_VERIFIED': return `${base} bg-emerald-50 text-emerald-600 border-emerald-200`;
        case 'MARKETING_VISIT_PENDING': return `${base} bg-amber-50 text-amber-600 border-amber-200 shadow-sm shadow-amber-100/50`;
        case 'MARKETING_VERIFIED': return `${base} bg-cyan-50 text-cyan-600 border-cyan-200`;
        case 'AWAITING_LISTING': return `${base} bg-indigo-50 text-indigo-600 border-indigo-200`;
        case 'REJECTED': return `${base} bg-rose-50 text-rose-600 border-rose-200`;
        case 'SUSPENDED': return `${base} bg-zinc-100 text-zinc-600 border-zinc-300`;
        case 'RENTED': return `${base} bg-violet-50 text-violet-600 border-violet-200`;
        case 'SOLD': return `${base} bg-pink-50 text-pink-600 border-pink-200`;

        // Transaction Statuses
        case 'created': return `${base} bg-blue-100 text-blue-800 border-blue-200`;
        case 'paid': return `${base} bg-green-100 text-green-800 border-green-200`;
        case 'failed': return `${base} bg-red-100 text-red-800 border-red-200`;
        case 'attempted': return `${base} bg-yellow-100 text-yellow-800 border-yellow-200`;
        case 'refunded': return `${base} bg-gray-100 text-gray-700 border-gray-200`;

        // Ticket Statuses
        case 'NEW': return `${base} bg-blue-50 text-blue-600 border-blue-100 shadow-sm shadow-blue-50/50`;
        case 'OPEN': return `${base} bg-sky-50 text-sky-600 border-sky-100 shadow-sm shadow-sky-50/50`;
        case 'ASSIGNED_VENDOR':
        case 'ASSIGNED_INTERNAL': return `${base} bg-indigo-50 text-indigo-600 border-indigo-100 shadow-sm shadow-indigo-50/50`;
        case 'WAITING_TENANT_RESPONSE':
        case 'WAITING_OWNER_RESPONSE': return `${base} bg-amber-50 text-amber-600 border-amber-100 shadow-sm shadow-amber-50/50`;
        case 'IN_PROGRESS': return `${base} bg-violet-50 text-violet-600 border-violet-100 shadow-sm shadow-violet-50/50`;
        case 'RESOLVED': return `${base} bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-50/50`;
        case 'CLOSED': return `${base} bg-slate-100 text-slate-500 border-slate-200 opacity-80`;
        case 'CANCELLED': return `${base} bg-rose-50 text-rose-600 border-rose-100 shadow-sm shadow-rose-50/50`;

        // Rent Statuses
        case 'DUE': return `${base} bg-yellow-100 text-yellow-800 border-yellow-200`;
        case 'PAID': return `${base} bg-green-100 text-green-800 border-green-200`;
        case 'PARTIALLY_PAID': return `${base} bg-lime-100 text-lime-800 border-lime-200`;
        case 'OVERDUE': return `${base} bg-red-100 text-red-800 border-red-200`;

        default: return defaultBadgeClasses;
    }
};

// --- Other Badge Functions ---

export const getPropertyTypeBadgeClasses = (type: PropertyType | string | null | undefined): string => {
    const base = badgeBaseClasses;
    switch (type) {
        case 'HOUSE': return `${base} bg-blue-50 text-blue-600 border-blue-100`;
        case 'LAND': return `${base} bg-emerald-50 text-emerald-600 border-emerald-100`;
        case 'BUILDING': return `${base} bg-indigo-50 text-indigo-600 border-indigo-100`;
        default: return defaultBadgeClasses;
    }
};

// UPDATED: full list of admin statuses
export const getPropertyAdminStatusBadgeClasses = (status: PropertyAdminStatus | string | null | undefined): string => {
    return getStatusBadgeClasses(status);
};

export const getListingTypeBadgeClasses = (type: ListingType | string | null | undefined): string => {
    const base = badgeBaseClasses;
    switch (type) {
        case 'RENTAL': return `${base} bg-cyan-50 text-cyan-600 border-cyan-100`;
        case 'SALE': return `${base} bg-orange-50 text-orange-600 border-orange-100`;
        default: return defaultBadgeClasses;
    }
};

export const getSubmitterTypeBadgeClasses = (type: SubmitterType | string | null | undefined): string => {
    const base = badgeBaseClasses;
    switch (type) {
        case 'AGENT': return `${base} bg-teal-100 text-teal-800 border-teal-200`;
        case 'OWNER': return `${base} bg-lime-100 text-lime-800 border-lime-200`;
        case 'BUILDER': return `${base} bg-sky-100 text-sky-800 border-sky-200`;
        default: return defaultBadgeClasses;
    }
};

export const getAvailabilityStatusBadgeClasses = (status: AvailabilityStatus | string | null | undefined): string => {
    const base = badgeBaseClasses;
    switch (status) {
        case 'UNDER_CONSTRUCTION': return `${base} bg-amber-100 text-amber-800 border-amber-200`;
        case 'READY_TO_MOVE': return `${base} bg-emerald-100 text-emerald-800 border-emerald-200`;
        default: return defaultBadgeClasses;
    }
}

export const getVendorStatusBadgeClasses = (status: VendorStatus | string | undefined | null): string => {
    const base = badgeBaseClasses;
    switch (status) {
        case 'ACTIVE': return `${base} bg-green-100 text-green-800 border-green-200`;
        case 'INACTIVE': return `${base} bg-red-100 text-red-800 border-red-200`;
        case 'UNDER_REVIEW': return `${base} bg-yellow-100 text-yellow-800 border-yellow-200`;
        default: return defaultBadgeClasses;
    }
};

export const getPriorityBadgeClasses = (priority: TicketPriority | string | null | undefined): string => {
    const base = badgeBaseClasses;
    switch (priority) {
        case 'LOW': return `${base} bg-gray-100 text-gray-700 border-gray-200`;
        case 'MEDIUM': return `${base} bg-yellow-100 text-yellow-800 border-yellow-200`;
        case 'HIGH': return `${base} bg-red-100 text-red-800 border-red-200`;
        default: return defaultBadgeClasses;
    }
};

export const getGenericBadgeClasses = (): string => {
    return defaultBadgeClasses;
};

export const getBooleanBadgeClasses = (value: boolean | null | undefined): string => {
    const base = badgeBaseClasses;
    if (value === true) return `${base} bg-green-100 text-green-800 border-green-200`;
    if (value === false) return `${base} bg-red-100 text-red-800 border-red-200`;
    return defaultBadgeClasses;
};

export const getYesNoBadgeClasses = (value: boolean | null | undefined): string => {
    const base = badgeBaseClasses;
    if (value === true) return `${base} bg-green-100 text-green-800 border-green-200`;
    if (value === false) return `${base} bg-gray-100 text-gray-700 border-gray-200`;
    return defaultBadgeClasses;
};