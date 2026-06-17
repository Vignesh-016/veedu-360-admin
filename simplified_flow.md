# Veedu360 Admin Panel: Complete Workflow Guide

This document describes exactly how the Veedu360 Admin Panel works, outlining each operational flow, status cycle, user action, and system module in plain English. No technical jargon or code file names are included, making it perfect for sharing directly with the project owner.

---

## 1. Dashboard & General Flow
* **Overview**: The main landing area when an administrator signs in. 
* **Key Stats**: Shows high-level statistics like total active properties, pending client leads, active rentals, and system updates.
* **Role Permissions**: What an administrator sees on the dashboard changes dynamically based on their role:
  * **Super Administrators** see full performance statistics, visual charts, and trend reports.
  * **Operations/Support Teams** see dedicated management shortcuts to their specific queues rather than high-level financial or visual metrics.

---

## 2. Properties Management Flow
* **Purpose**: Allows the team to add, review, edit, verify, and publish properties.
* **Property Life-Cycle / Tabs**:
  * **All**: Lists all registered properties.
  * **Awaiting Pre-Screening**: Newly submitted properties from landlords that require the first verification phone call.
  * **Pre-Screened**: Passed the initial call checklist and ready for a marketing review.
  * **Awaiting Marketing Verification**: Properties assigned to the marketing team to write descriptions, check room counts, and upload images.
  * **Marketing Verified**: Property details are verified and complete.
  * **Awaiting Listing**: Verified properties waiting for final publication approval.
  * **Listed**: Properties that are active and live for customer search.
  * **Suspended**: Listings temporarily hidden or removed from the platform.
* **Available Actions & Inputs**:
  * **Add / Edit Properties**: Input details such as Address, Locality, City, State, Rent Amount, Maintenance Fee, Safety Deposit, Bedrooms, Bathrooms, Furnishing level, and Map Coordinates (Latitude & Longitude).
  * **Manage Documents**: Upload, view, or delete important property paperwork (e.g., Sale Deeds, Encumbrance Certificates, Building Approvals, Floor Plans, and Property Photos).
  * **Assign Marketer**: Route the property to a specific marketing administrator for validation.
  * **Toggle Status**: Push a listing live (Listed) or mark it inactive (Suspended).

---

## 3. Customer & User Management Flow
* **Purpose**: The central directory of landlords, tenants, and visitors.
* **Available Actions & Inputs**:
  * **Search & Filters**: Find customers by name, phone number, email address, or visit package balances.
  * **Edit Profiles**: Update customer demographic information such as occupation, location preferences, preferred budget, gender, and religion.
  * **Manage Site Visits**: Manually adjust the balance of remaining property site visits a customer has purchased, or change their plan's expiration date.
  * **KYC Documentation**: Upload and check identity proofs (e.g., Aadhaar Cards, PAN Cards, Passports, Driving Licenses, and Rental Agreements).
  * **Detailed History Timeline**: Displays a summary of all properties owned/rented by the customer, their scheduling timeline, payments, active support tickets, and monthly rent history.

---

## 4. Admin Management Flow
* **Purpose**: Restricts administrative capabilities using Role-Based Access Control.
* **Available Actions & Inputs**:
  * **Register Administrator**: Create a new administrator account using Name, Email, Phone Number, Password, and Role.
  * **Roles Available**: Super Admin, Owner Telecalling Team, Tenant Telecalling Team, Marketing Team, Sales Team, Support Team, and Accounts Team.
  * **Toggle Active Status**: Instantly enable or block administrative login access.

---

## 5. Subscription & Visit Plans Flow
* **Purpose**: Manage the packages that clients purchase to view properties.
* **Available Actions & Inputs**:
  * **Plan Configuration**: Define the Plan Name, Price, Number of Visits allowed, and Validity duration (in days).
  * **Publishing**: Toggle plans as active or disabled to show or hide them from the public store.

---

## 6. Local Services & Vendor Desk Flow
* **Purpose**: Coordinates third-party maintenance providers (e.g., plumbers, electricians) who resolve property maintenance issues.
* **Available Actions & Inputs**:
  * **Service Categories**: Group repairs under categories like Plumbing, Electrical, Cleaning, and Carpentry.
  * **Register Vendors**: Add vendors with details including Company Name, Contact Person, Phone, Email, Address, Locality, Service Category, and Serviceable Distance.
  * **Vendor Verification**: Toggle vendor status to determine whether they can receive active maintenance orders.

---

## 7. Interaction & Lead Management Flow
* **Purpose**: Tracks potential tenant leads from initial inquiry through physical property visits.
* **Lead Flow Stages**:
  1. **Visit Requested**: A customer requests to view a property.
  2. **Telecaller Assigned**: A back-office agent is assigned to make contact.
  3. **Scheduled with Sales**: A physical visit is booked, and a Sales Agent is assigned.
  4. **Completed / Cancelled**: The visit takes place, or is cancelled.
* **Sales Agent Mobile Flow**:
  * Sales agents can log in to view their scheduled visits on a map.
  * **Submit Feedback**: Mark visits as completed or cancelled (inputting cancellation reasons), and record customer feedback (Liked, Disliked, Pending, or Budget Mismatch).

---

## 8. Rental Applications Flow
* **Purpose**: Manages applicants transitioning from viewing a property to signing a lease.
* **Application Life-Cycle**:
  * `Submitted` -> `Review In Progress` -> `Awaiting Landlord Approval` -> `Approved, Awaiting Payment` -> `Payment Confirmed` -> `Lease Finalized` -> `Tenancy Active`.
* **Available Actions**:
  * Assign processing agents to review files.
  * Approve/Reject applicant documents (KYC, income slips).
  * Record safety deposit payments.
  * Set lease start dates and activate tenancies.

---

## 9. Rent Invoicing & Payments Flow
* **Purpose**: Automated rent tracking, invoice generation, and payouts.
* **Available Actions**:
  * **Service Management Plans**: Set commissions (e.g., 8% property management service rate) for individual properties.
  * **Invoicing**: Track and log monthly rent invoice cycles with statuses: Due, Paid, Overdue, or Partially Paid.
  * **Record Payments**: Register payments using references (Transaction ID, payment dates, payment modes) to mark invoice records as Paid.
  * **Occupancy & Collections Overview**: A dashboard showing all occupied units, rent collection statuses, and overdue payments.

---

## 10. Support Tickets Flow
* **Purpose**: Resolution desk for maintenance requests filed by tenants or landlords.
* **Ticket Cycle**:
  * `New` -> `Open` -> `Assigned` (to vendor/admin) -> `In Progress` -> `Resolved` -> `Closed`.
* **Available Actions**:
  * File ticket, assign support agents, route repairs to registered vendors, track service fees, mark resolved, and close issues.
