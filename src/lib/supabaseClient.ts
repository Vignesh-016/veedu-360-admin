import { createClient, PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { Database, Json } from '../database.types';
import {
    // Enums used in parameters
    AdminRole,

    // Core Return Types
    AdminUser, AdminUserSummary,
    AdminPropertySummary, AdminPropertyDetails,
    CustomerSearchResultAdmin, CustomerFullDetailsAdmin,
    CustomerInteractionAdminView,
    VisitPlanAdminView, ManagementPlanInfo,
    TransactionAdminView, ContactPlan,
    ServiceAdminView, VendorAdminSummary, VendorAdminDetails,
    TicketAdminSummary, TicketAdminDetails,
    RentRecordAdminSummary, RentRecordAdminDetails,
    DashboardStats,

    // Team Assignment & Workflow Return Types
    AssignableOwnerContactProperty, AssignableMarketingProperty, AssignableTenantContactInteraction,
    SalesVisitAssignmentView,

    // Parameter Types
    GetPropertiesAdminParams, InsertPropertyAdminParams, UpdatePropertyAdminParams,
    UpdatePropertyImageAdminParams,
    UpdateCustomerProfileDetailsAdminParams, GetAllCustomerInteractionsAdminParams, UpdateCustomerInteractionAdminParams,
    InsertVisitPlanAdminParams, UpdateVisitPlanAdminParams, GetAllTransactionsAdminParams, UpdateTransactionStatusAdminParams,
    InsertContactPlanAdminParams, UpdateContactPlanAdminParams,
    CreateManagementPlanAdminParams, UpdateManagementPlanAdminParams,
    CreateRentRecordAdminParams, UpdateRentRecordAdminParams, ListRentRecordsAdminParams, RecordRentPaymentAdminParams,
    OccupiedPropertiesRentStatusReportAdminParams, PropertyPaymentHistoryAdminParams,
    ListTicketsAdminParams, UpdateTicketDetailsAdminParams, AssignTicketAdminParams, AssignTicketToVendorAdminParams,
    AddTicketCommentAdminParams,
    CreateServiceAdminParams, UpdateServiceAdminParams, ListServicesAdminParams,
    CreateVendorAdminParams, UpdateVendorAdminParams, ListVendorsAdminParams,
    AssignPropertyToOwnerTelecallerParams, MarkPropertyOwnerVerifiedParams,
    AssignPropertyToMarketerParams, MarkPropertyMarketingVerifiedParams, SetPropertyListingStatusParams,
    AssignInteractionToTenantTelecallerParams, MarkInteractionTenantVerifiedParams,
    MarkInteractionVisitCompletedSalesParams, MarkInteractionVisitCancelledSalesParams,
    AddAdminRoleParams, SetAdminRolesParams, UpdateAdminPincodesParams,
    TelecallingOwnerTeamPerformanceParams, SalesTeamPerformanceParams, TicketHandlingPerformanceParams,

    // Edge Function Response Types
    UploadDocumentResponse,
    UploadPropertyImageResponse,
    OccupiedPropertiesRentStatusReportAdminResults,
    PropertyPaymentHistoryAdminResults,
    AdminGetRentalApplicationsParams,
    AdminGetRentalApplicationsResults,
    AdminGetRentalApplicationDetailsResults,
    RentalApplicationAdminDetails,
    AdminAssignRentalApplicationParams,
    AdminUpdateRentalApplicationStatusParams,
    AdminAddRentalApplicationNoteParams,
    HomepageSettings
} from './types';
import { FullPropertyDetailsAdminData } from './reports/propertyType';


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY


export interface ApiResponse<T> {
    data: T | null;
    error: PostgrestError | string | null;
}


class RealEstateAdminApi {
    public supabase: SupabaseClient<Database>;

    constructor() {
        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error("Supabase URL or Anon Key is missing. Check your .env file.");
        }
        this.supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
    }

    private async handleRpc<T>(
        functionName: keyof Database['public']['Functions'],
        params?: object
    ): Promise<ApiResponse<T>> {
        try {
            const rpcParams = params ?? {};
            const { data, error } = await this.supabase.rpc(functionName, rpcParams);
            if (error) throw error;
            return { data: data as T, error: null };
        } catch (err) {
            const error = err as PostgrestError | Error;
            console.error(`Error calling RPC ${functionName}:`, error);
            return { data: null, error: error.message };
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async handleRpcAny<T>(functionName: string, params?: object): Promise<ApiResponse<T>> {
        try {
            const rpcParams = params ?? {};
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (this.supabase.rpc as any)(functionName, rpcParams);
            if (error) throw error;
            return { data: data as T, error: null };
        } catch (err) {
            const error = err as PostgrestError | Error;
            console.error(`Error calling RPC ${functionName}:`, error);
            return { data: null, error: error.message };
        }
    }

    private async handleFunction<T>(
        functionName: string,
        payload: object | FormData,
        options?: { headers?: Record<string, string> }
    ): Promise<ApiResponse<T>> {
        try {
            const invokeOptions = payload instanceof FormData
                ? { body: payload, headers: options?.headers }
                : { body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json', ...options?.headers } };

            const { data, error } = await this.supabase.functions.invoke(functionName, invokeOptions);

            if (error) throw error;
            if ((data as any)?.error) {
                throw new Error((data as any).error);
            }
            return { data: data as T, error: null };
        } catch (err: unknown) {
            const error = err as Error;
            console.error(`Error invoking function ${functionName}:`, error);
            let message = error.message;
            if ((error as any).context?.errorMessage) {
                message = (error as any).context.errorMessage;
            }
            return { data: null, error: message };
        }
    }

    async addAdminRole(params: AddAdminRoleParams): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('add_admin_role', params);
    }

    async removeAdminRole(userId: string, roleToRemove: AdminRole): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('remove_admin_role', { p_user_id: userId, p_role_to_remove: roleToRemove });
    }

    async setAdminRoles(params: SetAdminRolesParams): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('set_admin_roles', params);
    }

    async updateAdminPincodes(params: UpdateAdminPincodesParams): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('update_admin_pincodes', params);
    }

    async activateAdmin(adminUserId: string): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('activate_admin', { p_user_id: adminUserId });
    }

    async deactivateAdmin(adminUserId: string): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('deactivate_admin', { p_user_id: adminUserId });
    }

    async listAdmins(roleFilter?: AdminRole, isActiveFilter?: boolean, searchTerm?: string, offset: number = 0, limit: number = 25): Promise<ApiResponse<AdminUserSummary[]>> {
        return this.handleRpc<AdminUserSummary[]>('list_admins', {
            p_role_filter: roleFilter,
            p_is_active_filter: isActiveFilter,
            p_search_term: searchTerm,
            p_offset: offset,
            p_limit: limit
        });
    }

    async getAdminDetails(adminUserId: string): Promise<ApiResponse<AdminUser | null>> {
        const response = await this.handleRpc<AdminUser[]>('get_admin_details', { p_admin_user_id: adminUserId });
        return { data: response.data?.[0] ?? null, error: response.error };
    }

    async getMyAdminRoles(): Promise<ApiResponse<AdminRole[] | null>> {
        return this.handleRpc<AdminRole[] | null>('get_my_admin_roles');
    }

    async searchCustomers(searchTerm: string, hasActivePlan?: boolean, offset: number = 0, limit: number = 10): Promise<ApiResponse<CustomerSearchResultAdmin[]>> {
        return this.handleRpc<CustomerSearchResultAdmin[]>('search_customers_admin', {
            p_search_term: searchTerm,
            p_has_active_plan: hasActivePlan,
            p_offset: offset,
            p_limit: limit
        });
    }

    async getCustomerFullDetails(customerUserId: string): Promise<ApiResponse<CustomerFullDetailsAdmin | null>> {
        const response = await this.handleRpc<CustomerFullDetailsAdmin[]>('get_customer_full_details_admin', { p_customer_user_id: customerUserId });
        return { data: response.data?.[0] ?? null, error: response.error };
    }

    async updateCustomerVisits(customerUserId: string, visitBalance: number, expiryDate: string): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('update_customer_visits_admin', { p_customer_user_id: customerUserId, p_new_visit_balance: visitBalance, p_new_expiry_date: expiryDate });
    }

    async updateCustomerContactBalance(customerUserId: string, contactBalance: number): Promise<ApiResponse<null>> {
        return this.handleRpcAny<null>('update_customer_contact_balance_admin', {
            p_customer_user_id: customerUserId,
            p_new_contact_balance: contactBalance
        });
    }

    async updateCustomerProfileDetails(params: UpdateCustomerProfileDetailsAdminParams): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('update_customer_profile_details_admin', params);
    }

    async uploadCustomerDocumentAdmin(
        customerUserId: string,
        documentFile: File,
        documentType: string,
        description?: string
    ): Promise<ApiResponse<UploadDocumentResponse>> {
        const formData = new FormData();
        formData.append('customer_user_id', customerUserId);
        formData.append('document_file', documentFile);
        formData.append('document_type', documentType);
        if (description) formData.append('description', description);
        return this.handleFunction<UploadDocumentResponse>('upload-customer-document', formData);
    }

    async deleteCustomerDocumentAdmin(documentId: string): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('delete_customer_document_admin', { p_document_id: documentId });
    }

    async getPropertiesAdmin(params: GetPropertiesAdminParams): Promise<ApiResponse<AdminPropertySummary[]>> {
        return this.handleRpc<AdminPropertySummary[]>('get_properties_admin', params);
    }

    async getPropertyDetailsAdmin(propertyId: string): Promise<ApiResponse<AdminPropertyDetails | null>> {
        const response = await this.handleRpc<AdminPropertyDetails[]>('get_property_details_admin', { p_property_id_input: propertyId });
        return { data: response.data?.[0] ?? null, error: response.error };
    }

    async insertPropertyAdmin(params: InsertPropertyAdminParams): Promise<ApiResponse<string>> {
        return this.handleRpc<string>('insert_property_admin', params);
    }

    async updatePropertyAdmin(params: UpdatePropertyAdminParams): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('update_property_admin', params);
    }

    async deletePropertyAdmin(propertyId: string): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('delete_property_admin', { p_property_id: propertyId });
    }

    async uploadPropertyImageAdmin(
        propertyId: string,
        file: File,
        description?: string,
        displayOrder?: number,
        isInternalImage?: boolean
    ): Promise<ApiResponse<UploadPropertyImageResponse>> {
        const formData = new FormData();
        formData.append('property_id', propertyId);
        formData.append('image_file', file);
        if (description) formData.append('description', description);
        if (displayOrder !== undefined) formData.append('display_order', displayOrder.toString());
        if (isInternalImage !== undefined) formData.append('is_internal_image', isInternalImage.toString());
        return this.handleFunction<UploadPropertyImageResponse>('upload-property-image', formData);
    }

    async deletePropertyImageAdmin(imageId: string): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('delete_property_image_admin', { p_image_id: imageId });
    }

    async updatePropertyImageAdmin(params: UpdatePropertyImageAdminParams): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('update_property_image_admin', params);
    }

    async uploadPropertyDocumentAdmin(
        propertyId: string,
        documentFile: File,
        documentType: string,
        description?: string
    ): Promise<ApiResponse<UploadDocumentResponse>> {
        const formData = new FormData();
        formData.append('property_id', propertyId);
        formData.append('document_file', documentFile);
        formData.append('document_type', documentType);
        if (description) formData.append('description', description);
        return this.handleFunction<UploadDocumentResponse>('upload-property-document', formData);
    }

    async deletePropertyDocumentAdmin(documentId: string): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('delete_property_document_admin', { p_document_id: documentId });
    }

    async setPropertyListingStatus(params: SetPropertyListingStatusParams): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('set_property_listing_status_admin', params);
    }

    async getAdminPropertyReport(propertyId: string): Promise<ApiResponse<FullPropertyDetailsAdminData[] | null>> {
        return this.handleRpc<FullPropertyDetailsAdminData[] | null>('get_full_property_details_admin', { p_property_id_input: propertyId });
    }

    async getAllCustomerInteractionsAdmin(params: GetAllCustomerInteractionsAdminParams): Promise<ApiResponse<CustomerInteractionAdminView[]>> {
        return this.handleRpc<CustomerInteractionAdminView[]>('get_all_customer_interactions_admin', params);
    }

    async updateCustomerInteractionAdmin(params: UpdateCustomerInteractionAdminParams): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('update_customer_interaction_admin', params);
    }

    async getAllVisitPlansAdmin(isActiveFilter?: boolean): Promise<ApiResponse<VisitPlanAdminView[]>> {
        return this.handleRpc<VisitPlanAdminView[]>('get_all_visit_plans_admin', { p_is_active_filter: isActiveFilter });
    }

    async insertVisitPlanAdmin(params: InsertVisitPlanAdminParams): Promise<ApiResponse<string>> {
        return this.handleRpc<string>('insert_visit_plan_admin', params);
    }

    async updateVisitPlanAdmin(params: UpdateVisitPlanAdminParams): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('update_visit_plan_admin', params);
    }

    async getAllContactPlansAdmin(isActiveFilter?: boolean): Promise<ApiResponse<ContactPlan[]>> {
        return this.handleRpcAny<ContactPlan[]>('get_all_contact_plans_admin', { p_is_active_filter: isActiveFilter });
    }

    async insertContactPlanAdmin(params: InsertContactPlanAdminParams): Promise<ApiResponse<string>> {
        return this.handleRpcAny<string>('insert_contact_plan_admin', params);
    }

    async updateContactPlanAdmin(params: UpdateContactPlanAdminParams): Promise<ApiResponse<null>> {
        return this.handleRpcAny<null>('update_contact_plan_admin', params);
    }

    async deleteContactPlanAdmin(planId: string): Promise<ApiResponse<null>> {
        return this.handleRpcAny<null>('delete_contact_plan_admin', { p_plan_id: planId });
    }

    async getAllTransactionsAdmin(params: GetAllTransactionsAdminParams): Promise<ApiResponse<TransactionAdminView[]>> {
        return this.handleRpc<TransactionAdminView[]>('get_all_transactions_admin', params);
    }

    async updateTransactionStatusAdmin(params: UpdateTransactionStatusAdminParams): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('update_transaction_status_admin', params);
    }

    async createManagementPlanAdmin(params: CreateManagementPlanAdminParams): Promise<ApiResponse<string>> {
        return this.handleRpc<string>('create_management_plan_admin', params);
    }

    async updateManagementPlanAdmin(params: UpdateManagementPlanAdminParams): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('update_management_plan_admin', params);
    }

    async listManagementPlansAdmin(isActiveFilter?: boolean, offset: number = 0, limit: number = 25): Promise<ApiResponse<ManagementPlanInfo[]>> {
        return this.handleRpc<ManagementPlanInfo[]>('list_management_plans_admin', { p_is_active_filter: isActiveFilter, p_offset: offset, p_limit: limit });
    }

    async getManagementPlanDetailsAdmin(planId: string): Promise<ApiResponse<ManagementPlanInfo | null>> {
        const response = await this.handleRpc<ManagementPlanInfo[]>('get_management_plan_details_admin', { p_plan_id_input: planId });
        return { data: response.data?.[0] ?? null, error: response.error };
    }

    async createRentRecordAdmin(params: CreateRentRecordAdminParams): Promise<ApiResponse<string>> {
        return this.handleRpc<string>('create_rent_record_admin', params);
    }

    async updateRentRecordAdmin(params: UpdateRentRecordAdminParams): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('update_rent_record_admin', params);
    }

    async listRentRecordsAdmin(params: ListRentRecordsAdminParams): Promise<ApiResponse<RentRecordAdminSummary[]>> {
        return this.handleRpc<RentRecordAdminSummary[]>('list_rent_records_admin', params);
    }

    async getRentRecordDetailsAdmin(rentRecordId: string): Promise<ApiResponse<RentRecordAdminDetails | null>> {
        const response = await this.handleRpc<RentRecordAdminDetails[]>('get_rent_record_details_admin', { p_rent_record_id_input: rentRecordId });
        return { data: response.data?.[0] ?? null, error: response.error };
    }

    async deleteRentRecordAdmin(rentRecordId: string): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('delete_rent_record_admin', { p_rent_record_id: rentRecordId });
    }

    async recordRentPaymentAdmin(params: RecordRentPaymentAdminParams): Promise<ApiResponse<string>> {
        return this.handleRpc<string>('record_rent_payment_admin', params);
    }

    async deleteRentPaymentAdmin(paymentId: string): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('delete_rent_payment_admin', { p_payment_id: paymentId });
    }

    async getOccupiedPropertiesRentStatusReportAdmin(params: OccupiedPropertiesRentStatusReportAdminParams): Promise<ApiResponse<OccupiedPropertiesRentStatusReportAdminResults>> {
        return this.handleRpc<OccupiedPropertiesRentStatusReportAdminResults>('get_occupied_properties_rent_status_report_admin', params);
    }

    async getPropertyPaymentHistoryLandlord(params: PropertyPaymentHistoryAdminParams): Promise<ApiResponse<PropertyPaymentHistoryAdminResults>> {
        return this.handleRpc<PropertyPaymentHistoryAdminResults>('get_property_payment_history_landlord', params);
    }

    async createUpcomingRentRecordsAdmin(): Promise<ApiResponse<Database['public']['Functions']['create_upcoming_rent_records_admin']['Returns']>> {
        return this.handleRpc<Database['public']['Functions']['create_upcoming_rent_records_admin']['Returns']>('create_upcoming_rent_records_admin');
    }

    async listTicketsAdmin(params: ListTicketsAdminParams): Promise<ApiResponse<TicketAdminSummary[]>> {
        return this.handleRpc<TicketAdminSummary[]>('list_tickets_admin', params);
    }

    async getTicketDetailsAdmin(ticketId: number): Promise<ApiResponse<TicketAdminDetails | null>> {
        const response = await this.handleRpc<TicketAdminDetails[]>('get_ticket_details_admin', { p_ticket_id_input: ticketId });
        return { data: response.data?.[0] ?? null, error: response.error };
    }

    async updateTicketDetailsAdmin(params: UpdateTicketDetailsAdminParams): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('update_ticket_details_admin', params);
    }

    async assignTicketAdmin(params: AssignTicketAdminParams): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('assign_ticket_admin', params);
    }

    async assignTicketToVendorAdmin(params: AssignTicketToVendorAdminParams): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('assign_ticket_to_vendor_admin', params);
    }

    async assignTicketToSelfTelecaller(ticketId: number): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('assign_ticket_to_self_telecaller', { p_ticket_id: ticketId });
    }

    async unassignTicketAdmin(ticketId: number): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('unassign_ticket_admin', { p_ticket_id: ticketId });
    }

    async addTicketCommentAdmin(params: AddTicketCommentAdminParams): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('add_ticket_comment_admin', params);
    }

    async deleteTicketCommentAdmin(commentId: number): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('delete_ticket_comment_admin', { p_comment_id: commentId });
    }

    async deleteTicketImageAdmin(imageId: string): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('delete_ticket_image_admin', { p_image_id: imageId });
    }

    async uploadTicketImageAdmin(ticketId: number, imageFile: File, description?: string): Promise<ApiResponse<UploadDocumentResponse>> {
        const formData = new FormData();
        formData.append('ticket_id', ticketId.toString());
        formData.append('image_file', imageFile);
        if (description) formData.append('description', description);
        return this.handleFunction<UploadDocumentResponse>('upload-ticket-images', formData);
    }

    async createServiceAdmin(params: CreateServiceAdminParams): Promise<ApiResponse<number>> {
        return this.handleRpc<number>('create_service_admin', params);
    }

    async updateServiceAdmin(params: UpdateServiceAdminParams): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('update_service_admin', params);
    }

    async deleteServiceAdmin(serviceId: number): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('delete_service_admin', { p_service_id: serviceId });
    }

    async listServicesAdmin(params?: ListServicesAdminParams): Promise<ApiResponse<ServiceAdminView[]>> {
        return this.handleRpc<ServiceAdminView[]>('list_services_admin', params);
    }

    async createVendorAdmin(params: CreateVendorAdminParams): Promise<ApiResponse<string>> {
        return this.handleRpc<string>('create_vendor_admin', params);
    }

    async updateVendorAdmin(params: UpdateVendorAdminParams): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('update_vendor_admin', params);
    }

    async getVendorDetailsAdmin(vendorId: string): Promise<ApiResponse<VendorAdminDetails | null>> {
        const response = await this.handleRpc<VendorAdminDetails[]>('get_vendor_details_admin', { p_vendor_id_input: vendorId });
        return { data: response.data?.[0] ?? null, error: response.error };
    }

    async deleteVendorAdmin(vendorId: string): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('delete_vendor_admin', { p_vendor_id: vendorId });
    }

    async assignServiceToVendorAdmin(vendorId: string, serviceId: number): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('assign_service_to_vendor_admin', { p_vendor_id_input: vendorId, p_service_id_input: serviceId });
    }

    async removeServiceFromVendorAdmin(vendorId: string, serviceId: number): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('remove_service_from_vendor_admin', { p_vendor_id_input: vendorId, p_service_id_input: serviceId });
    }

    async listVendorsAdmin(params?: ListVendorsAdminParams): Promise<ApiResponse<VendorAdminSummary[]>> {
        return this.handleRpc<VendorAdminSummary[]>('list_vendors_admin', params);
    }

    async getAssignableOwnerContactProperties(cityFilter?: string, pincodeFilter?: number, offset: number = 0, limit: number = 10): Promise<ApiResponse<AssignableOwnerContactProperty[]>> {
        return this.handleRpc<AssignableOwnerContactProperty[]>('get_assignable_owner_contact_properties_admin', { p_city_filter: cityFilter, p_pincode_filter: pincodeFilter, p_offset: offset, p_limit: limit });
    }
    async assignPropertyToOwnerTelecaller(params: AssignPropertyToOwnerTelecallerParams): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('assign_property_to_owner_telecaller_admin', params);
    }
    async selfAssignPropertyForOwnerContact(propertyId: string): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('self_assign_property_for_owner_contact_admin', { p_property_id: propertyId });
    }
    async unassignPropertyFromOwnerTelecaller(propertyId: string): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('unassign_property_from_owner_telecaller_admin', { p_property_id: propertyId });
    }
    async markPropertyOwnerVerified(params: MarkPropertyOwnerVerifiedParams): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('mark_property_owner_verified_admin', params);
    }

    async getAssignableMarketingProperties(cityFilter?: string, pincodeFilter?: number, offset: number = 0, limit: number = 10): Promise<ApiResponse<AssignableMarketingProperty[]>> {
        return this.handleRpc<AssignableMarketingProperty[]>('get_assignable_marketing_properties_admin', { p_city_filter: cityFilter, p_pincode_filter: pincodeFilter, p_offset: offset, p_limit: limit });
    }
    async assignPropertyToMarketer(params: AssignPropertyToMarketerParams): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('assign_property_to_marketer_admin', params);
    }
    async unassignPropertyFromMarketer(propertyId: string): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('unassign_property_from_marketer_admin', { p_property_id: propertyId });
    }
    async markPropertyMarketingVerified(params: MarkPropertyMarketingVerifiedParams): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('mark_property_marketing_verified_admin', params);
    }

    async getAssignableTenantContactInteractions(propertyIdFilter?: string, customerSearchTerm?: string, offset: number = 0, limit: number = 10): Promise<ApiResponse<AssignableTenantContactInteraction[]>> {
        return this.handleRpc<AssignableTenantContactInteraction[]>('get_assignable_tenant_contact_interactions_admin', { p_property_id_filter: propertyIdFilter, p_customer_search_term: customerSearchTerm, p_offset: offset, p_limit: limit });
    }
    async assignInteractionToTenantTelecaller(params: AssignInteractionToTenantTelecallerParams): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('assign_interaction_to_tenant_telecaller_admin', params);
    }
    async selfAssignInteractionForTenantContact(interactionId: string): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('self_assign_interaction_for_tenant_contact_admin', { p_interaction_id: interactionId });
    }
    async unassignInteractionFromTenantTelecaller(interactionId: string): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('unassign_interaction_from_tenant_telecaller_admin', { p_interaction_id: interactionId });
    }
    async markInteractionTenantVerified(params: MarkInteractionTenantVerifiedParams): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('mark_interaction_tenant_verified_admin', params);
    }

    async assignPendingSalesVisitsAdmin(): Promise<ApiResponse<Json>> {
        return this.handleRpc<Json>('assign_pending_sales_visits_admin');
    }
    async getMySalesVisitsAdmin(visitDate?: string): Promise<ApiResponse<SalesVisitAssignmentView[]>> {
        return this.handleRpc<SalesVisitAssignmentView[]>('get_my_sales_visits_admin', { p_visit_date: visitDate });
    }
    async markInteractionVisitCompletedSales(params: MarkInteractionVisitCompletedSalesParams): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('mark_interaction_visit_completed_sales_admin', params);
    }
    async markInteractionVisitCancelledSales(params: MarkInteractionVisitCancelledSalesParams): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('mark_interaction_visit_cancelled_sales_admin', params);
    }

    async getDashboardStatsAdmin(): Promise<ApiResponse<DashboardStats | null>> {
        return this.handleRpc<DashboardStats | null>('get_dashboard_stats_admin');
    }

    async getTelecallingOwnerTeamPerformanceAdmin(params: TelecallingOwnerTeamPerformanceParams): Promise<ApiResponse<Database['public']['Functions']['get_telecalling_owner_team_performance_admin']['Returns']>> {
        return this.handleRpc<Database['public']['Functions']['get_telecalling_owner_team_performance_admin']['Returns']>('get_telecalling_owner_team_performance_admin', params);
    }
    async getSalesTeamPerformanceAdmin(params: SalesTeamPerformanceParams): Promise<ApiResponse<Database['public']['Functions']['get_sales_team_performance_admin']['Returns']>> {
        return this.handleRpc<Database['public']['Functions']['get_sales_team_performance_admin']['Returns']>('get_sales_team_performance_admin', params);
    }
    async getTicketHandlingPerformanceAdmin(params: TicketHandlingPerformanceParams): Promise<ApiResponse<Database['public']['Functions']['get_ticket_handling_performance_admin']['Returns']>> {
        return this.handleRpc<Database['public']['Functions']['get_ticket_handling_performance_admin']['Returns']>('get_ticket_handling_performance_admin', params);
    }

    async adminGetRentalApplications(params: AdminGetRentalApplicationsParams): Promise<ApiResponse<AdminGetRentalApplicationsResults>> {
        return this.handleRpc<AdminGetRentalApplicationsResults>('admin_get_rental_applications', params);
    }

    async adminGetRentalApplicationDetails(applicationId: string): Promise<ApiResponse<RentalApplicationAdminDetails | null>> {
        const response = await this.handleRpc<AdminGetRentalApplicationDetailsResults>('admin_get_rental_application_details', { p_application_id: applicationId });
        return { data: response.data?.[0] ?? null, error: response.error };
    }

    async adminSelfAssignRentalApplication(applicationId: string): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('admin_self_assign_rental_application', { p_application_id: applicationId });
    }

    async adminAssignRentalApplication(params: AdminAssignRentalApplicationParams): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('admin_assign_rental_application', params);
    }

    async adminUnassignRentalApplication(applicationId: string): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('admin_unassign_rental_application', { p_application_id: applicationId });
    }

    async adminUpdateRentalApplicationStatus(params: AdminUpdateRentalApplicationStatusParams): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('admin_update_rental_application_status', params);
    }

    async adminAddRentalApplicationNote(params: AdminAddRentalApplicationNoteParams): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('admin_add_rental_application_note', params);
    }

    async adminFinalizeLeaseFromApplication(applicationId: string): Promise<ApiResponse<null>> {
        return this.handleRpc<null>('admin_finalize_lease_from_application', { p_application_id: applicationId });
    }

    async getHomepageSettings(): Promise<ApiResponse<HomepageSettings>> {
        try {
            const { data, error } = await this.supabase
                .from('site_settings' as any)
                .select('content')
                .eq('key', 'homepage')
                .single();
            if (error) throw error;
            return { data: (data as any)?.content as HomepageSettings, error: null };
        } catch (err: any) {
            console.error("Failed to fetch homepage settings:", err);
            return { data: null, error: err.message || err };
        }
    }

    async updateHomepageSettings(content: HomepageSettings): Promise<ApiResponse<null>> {
        try {
            const { error } = await this.supabase
                .from('site_settings' as any)
                .upsert({ key: 'homepage', content: content });
            if (error) throw error;
            return { data: null, error: null };
        } catch (err: any) {
            console.error("Failed to update homepage settings:", err);
            return { data: null, error: err.message || err };
        }
    }
}

const api = new RealEstateAdminApi();
export default api;