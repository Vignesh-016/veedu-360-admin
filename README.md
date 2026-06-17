# User Manual

Welcome to the official user manual for the Admin Panel. This guide is designed to help you understand and effectively use all the features of the platform, from managing properties and customers to handling complex internal workflows.

## Table of Contents

### [Chapter 1: Introduction](#chapter-1-introduction)
*   [1.1 Purpose of the Admin Panel](#11-purpose-of-the-admin-panel)
*   [1.2 Overview of Key Modules](#12-overview-of-key-modules)

### [Chapter 2: Getting Started](#chapter-2-getting-started)
*   [2.1 Logging In](#21-logging-in)
*   [2.2 Navigating the Interface](#22-navigating-the-interface)
    *   [2.2.1 The Sidebar](#221-the-sidebar)
    *   [2.2.2 The Navbar](#222-the-navbar)
*   [2.3 Understanding the Dashboard](#23-understanding-the-dashboard)
    *   [2.3.1 Navigational Cards](#231-navigational-cards)
    *   [2.3.2 Statistical Charts (Super Admin)](#232-statistical-charts-super-admin)

### [Chapter 3: User Roles & Permissions](#chapter-3-user-roles--permissions)
*   [3.1 Super Admin](#31-super-admin)
*   [3.2 Telecalling Owner Team](#32-telecalling-owner-team)
*   [3.3 Marketing Team](#33-marketing-team)
*   [3.4 Telecalling Tenant Team](#34-telecalling-tenant-team)
*   [3.5 Sales Team](#35-sales-team)
*   [3.6 Accounts Team](#36-accounts-team)

### [Chapter 4: Managing Properties](#chapter-4-managing-properties)
*   [4.1 The Property Workflow Tabs](#41-the-property-workflow-tabs)
*   [4.2 Viewing and Filtering Properties](#42-viewing-and-filtering-properties)
*   [4.3 Adding and Editing a Property](#43-adding-and-editing-a-property)
*   [4.4 Managing Property Images](#44-managing-property-images)
*   [4.5 Managing Property Documents](#45-managing-property-documents)
*   [4.6 Understanding the Property Details Page](#46-understanding-the-property-details-page)
*   [4.7 Automated Workflows](#47-automated-workflows)
    *   [4.7.1 Automated Marketing Assignments](#471-automated-marketing-assignments)

### [Chapter 5: Managing Customers](#chapter-5-managing-customers)
*   [5.1 Searching and Viewing Customers](#51-searching-and-viewing-customers)
*   [5.2 Understanding the Customer Details Page](#52-understanding-the-customer-details-page)
*   [5.3 Editing Customer Visits & Expiry](#53-editing-customer-visits--expiry)
*   [5.4 Editing Customer Profile Details](#54-editing-customer-profile-details)
*   [5.5 Managing Customer Documents](#55-managing-customer-documents)

### [Chapter 6: Core Workflows](#chapter-6-core-workflows)
*   [6.1 Property Onboarding Workflow](#61-property-onboarding-workflow)
    *   [6.1.1 Owner Telecalling: Assigning & Verifying Properties](#611-owner-telecalling-assigning--verifying-properties)
    *   [6.1.2 Marketing Team: Assigning & Verifying Properties](#612-marketing-team-assigning--verifying-properties)
*   [6.2 Customer Interaction & Sales Workflow](#62-customer-interaction--sales-workflow)
    *   [6.2.1 Tenant Telecalling: Handling Visit Requests](#621-tenant-telecalling-handling-visit-requests)
    *   [6.2.2 Sales Team: Managing "My Sales Visits"](#622-sales-team-managing-my-sales-visits)
    *   [6.2.3 Automated Sales Visit Assignments](#623-automated-sales-visit-assignments)
*   [6.3 Rental Application Workflow](#63-rental-application-workflow)
    *   [6.3.1 Managing Applications](#631-managing-applications)
    *   [6.3.2 Assigning Applications](#632-assigning-applications)
    *   [6.3.3 Finalizing a Lease](#633-finalizing-a-lease)

### [Chapter 7: Financial & Rent Management](#chapter-7-financial--rent-management)
*   [7.1 Managing Visit Plans](#71-managing-visit-plans)
*   [7.2 Viewing Transactions](#72-viewing-transactions)
*   [7.3 Managing Property Management Plans](#73-managing-property-management-plans)
*   [7.4 Managing Rent Records](#74-managing-rent-records)
    *   [7.4.1 Creating and Editing Rent Records](#741-creating-and-editing-rent-records)
    *   [7.4.2 Recording and Deleting Payments](#742-recording-and-deleting-payments)
*   [7.5 Viewing Rent Payments Overview](#75-viewing-rent-payments-overview)
*   [7.6 Occupancy & Rent Status Report](#76-occupancy--rent-status-report)

### [Chapter 8: Support & Vendor Management](#chapter-8-support--vendor-management)
*   [8.1 Managing Support Tickets](#81-managing-support-tickets)
    *   [8.1.1 The Ticket Workflow Tabs](#811-the-ticket-workflow-tabs)
    *   [8.1.2 Viewing and Editing a Ticket](#812-viewing-and-editing-a-ticket)
    *   [8.1.3 Assigning Tickets](#813-assigning-tickets)
*   [8.2 Managing Vendors](#82-managing-vendors)
*   [8.3 Managing Services](#83-managing-services)

### [Chapter 9: System Administration (Super Admin)](#chapter-9-system-administration-super-admin)
*   [9.1 Managing Admin Users](#91-managing-admin-users)
*   [9.2 Assigning Roles and Pincodes](#92-assigning-roles-and-pincodes)

### [Chapter 10: Automated SMS Notifications](#chapter-10-automated-sms-notifications)
*   [10.1 Introduction to Automated Notifications](#101-introduction-to-automated-notifications)
*   [10.2 Property Workflow Notifications](#102-property-workflow-notifications)
    *   [10.2.1 Property Submission Confirmation (`POST_SUBMITTED`)](#1021-property-submission-confirmation-post_submitted)
    *   [10.2.2 Marketing Assignment Notifications](#1022-marketing-assignment-notifications)
    *   [10.2.3 Property Rented Notifications](#1023-property-rented-notifications)
*   [10.3 Customer Interaction & Sales Notifications](#103-customer-interaction--sales-notifications)
    *   [10.3.1 Visit Scheduled Confirmation](#1031-visit-scheduled-confirmation)
*   [10.4 Financial Notifications](#104-financial-notifications)
    *   [10.4.1 Visit Plan Purchase Confirmation (`CREDITS_PURCHASED`)](#1041-visit-plan-purchase-confirmation-credits_purchased)
    *   [10.4.2 Rent Due Reminder (`RENT_DUE`)](#1042-rent-due-reminder-rent_due)
*   [10.5 Support Ticket Notifications](#105-support-ticket-notifications)
    *   [10.5.1 Ticket Creation & Closure](#1051-ticket-creation--closure)
    *   [10.5.2 Vendor Assignment Notifications](#1052-vendor-assignment-notifications)

### [Appendix A: Glossary of Statuses](#appendix-a-glossary-of-statuses)
*   [A.1 Property Admin Statuses](#a1-property-admin-statuses)
*   [A.2 Interaction Statuses](#a2-interaction-statuses)
*   [A.3 Rental Application Statuses](#a3-rental-application-statuses)
*   [A.4 Ticket Statuses](#a4-ticket-statuses)
*   [A.5 Rent Statuses](#a5-rent-statuses)

***

# Chapter 1: Introduction

## 1.1 Purpose of the Admin Panel

Welcome to the Admin Panel. This platform is a powerful, centralized system designed to manage every facet of your real estate operations. Its primary purpose is to provide your team with a single source of truth for all property, customer, and financial data, streamlining complex workflows and enhancing collaboration across different departments.

This tool is built for the entire administrative staff, with specific features and permissions tailored for:

*   **Super Admins:** Oversee the entire system and manage user access.
*   **Telecalling Teams:** Handle initial property owner verification and customer visit requests.
*   **Marketing Team:** Manage property verification, listing status, and promotional activities.
*   **Sales Team:** Conduct property visits and manage the sales pipeline.
*   **Accounts Team:** Oversee financial aspects like visit plans, transactions, and rent management.

By using this panel, your organization can achieve greater efficiency, maintain data integrity, and provide a seamless experience for both your team and your customers.

## 1.2 Overview of Key Modules

The Admin Panel is organized into several key modules, each corresponding to a major area of your business operations. You can access these modules through the sidebar navigation.

*   **Dashboard:** Your landing page after logging in. It provides at-a-glance statistics (for authorized roles) and quick navigation to all other modules.

*   **Properties:** The heart of the system. Here you can add, edit, and manage all property listings. This module includes a detailed workflow for verifying properties from initial submission to public listing.

*   **Customers:** A complete Customer Relationship Management (CRM) tool. View detailed customer profiles, including their owned properties, rental history, interactions, and purchased visit plans.

*   **Interactions & Sales:** This area covers the entire customer journey.
    *   **Customer Interactions:** Track a customer's interest in properties, from their initial "wishlist" to scheduling a site visit.
    *   **My Sales Visits:** A dedicated view for the Sales Team to manage their daily assigned property visits with customers.

*   **Rental Applications:** A dedicated module to manage the entire rental application lifecycle, from submission by a customer to review, approval, and final lease generation.

*   **Financial Management:** A suite of tools for the Accounts Team.
    *   **Visit Plans & Transactions:** Create and manage prepaid visit plans for customers and view all related financial transactions.
    *   **Management Plans:** Define service plans for property management agreements.
    *   **Rent Records & Payments:** Generate and track rent dues for rental properties and view payment histories.
    *   **Occupancy:** A specialized report to monitor the occupancy and rent payment status of all rental properties.

*   **Support & Operations:** Tools for managing internal and external support services.
    *   **Tickets:** A complete helpdesk system for managing support tickets raised by property owners and tenants.
    *   **Vendors & Services:** Maintain a database of external service vendors and the specific services they offer.

*   **Admin Management:** A section exclusive to Super Admins for creating new admin accounts, assigning roles, and managing permissions across the platform.

***


# Chapter 2: Getting Started

This chapter will guide you through the initial steps of accessing and navigating the Admin Panel. By the end, you will be comfortable with the login process and the main components of the user interface.

## 2.1 Logging In

To ensure security and data integrity, access to the Admin Panel is restricted to authorized personnel only.

1.  **Navigate to the Login Page:** Your administrator will provide you with the URL for the Admin Panel. The login page will look similar to the image below.

    

2.  **Authentication:** The platform uses Google for authentication.
    *   Click the **"Sign in with Google"** button.
    *   You will be prompted to choose a Google account.

3.  **Authorization:** Once you have successfully authenticated with Google, the system will check if your account has been granted admin privileges.
    *   If you are an authorized admin, you will be redirected to the main **Dashboard**.
    *   If your account is not authorized, you will not be ableto proceed. Please contact your system administrator to request access.

## 2.2 Navigating the Interface

The Admin Panel is designed with a clean and intuitive layout, consisting of three primary areas: the Sidebar, the Navbar, and the main Content Area.



### 2.2.1 The Sidebar

The Sidebar, located on the left side of the screen, is your primary tool for navigating between the different modules of the application.

*   **Navigation Links:** Each link in the sidebar corresponds to a key module, such as "Properties," "Customers," or "Tickets."
*   **Role-Based Access:** The links you see in the sidebar are automatically tailored to your assigned user role. You will only see links to modules you have permission to access.
*   **Collapse/Expand (Desktop):** On larger screens, you can collapse the sidebar to a compact icon-only view by clicking the **Collapse** button (<kbd>←</kbd>) at the bottom. This maximizes your content area. Click it again (<kbd>→</kbd>) to expand it.
*   **Mobile View:** On mobile devices or smaller screens, the sidebar is hidden by default. Click the **hamburger menu icon** (<kbd>☰</kbd>) on the top-left Navbar to open it. Clicking a link or the 'X' button will close it.

### 2.2.2 The Navbar

The Navbar is located at the very top of the screen and remains visible at all times.

*   **Company Logo:** Clicking the logo will always take you back to the main Dashboard page.
*   **User Information:** On the right side, your email address is displayed, confirming which account you are logged in with.
*   **Sign Out:** The "Sign Out" button allows you to securely log out of the Admin Panel.

## 2.3 Understanding the Dashboard

The Dashboard is the first page you see after logging in. It serves as a central hub, providing a high-level overview and quick access to all essential modules.

### 2.3.1 Navigational Cards

The main section of the dashboard for most users consists of a grid of navigational cards. Each card represents a module and provides:

*   A descriptive **Label** (e.g., "Properties").
*   An **Icon** for easy identification.
*   A brief **Description** of the module's purpose.

Clicking on any of these cards will take you directly to that module's main page. Like the sidebar, the cards displayed are dependent on your user role.

### 2.3.2 Statistical Charts (Super Admin)

For users with the **Super Admin** role, the dashboard includes an additional section at the top displaying various statistical charts and key performance indicators (KPIs).

*   **Purpose:** These charts provide a real-time, high-level overview of the entire business operation, including property statuses, interaction volumes, ticket priorities, and financial summaries.
*   **Interactivity:** You can hover over chart segments to view detailed tooltips with specific numbers and percentages.
*   **Refresh Button:** A "Refresh Stats" button is available to fetch the most up-to-date data without reloading the entire page.

This feature is designed to give leadership a quick, data-driven snapshot of the platform's activity and business health.

***

# Chapter 3: User Roles & Permissions

The Admin Panel utilizes a role-based access control system to ensure that each user has access only to the features and data relevant to their responsibilities. Understanding your role is key to using the platform effectively.

## 3.1 Super Admin

The **Super Admin** role has the highest level of access and is typically reserved for system administrators or top-level management.

**Key Responsibilities & Permissions:**
*   **Full Access:** Can view and manage all modules, including Properties, Customers, Interactions, Tickets, Finances, and Vendors.
*   **Admin Management:** The only role that can access the "Admins" page to create, edit, and deactivate other admin accounts.
*   **Role Assignment:** Can assign and modify roles for all other users.
*   **Global Oversight:** Can view all data across all teams and workflows, including all assigned and unassigned tasks.
*   **System-Wide Reports:** Has exclusive access to the comprehensive statistical charts on the Dashboard.
*   **Data Deletion:** Can perform critical delete operations, such as deleting properties or vendors.

## 3.2 Telecalling Owner Team

This role is focused on the initial stages of the property onboarding workflow, specifically communicating with property owners.

**Key Responsibilities & Permissions:**
*   **Property Onboarding:** Accesses the "Assignable Owner Contact" queue on the Properties page to view newly submitted properties.
*   **Self-Assignment:** Can assign properties from this queue to themselves to begin the verification process.
*   **Owner Verification:** Responsible for contacting the property owner, verifying details, and collecting necessary documents.
*   **Document Management:** Can upload property-related documents (e.g., Sale Deed, Tax Receipts).
*   **Mark as Verified:** After successful verification, this role marks the property as "Owner Verified," which moves it to the next stage in the workflow (Marketing).
*   **Customer Management:** Can view and edit customer details, particularly for property owners.

## 3.3 Marketing Team

The Marketing Team takes over after a property has been verified by the owner-side telecallers. Their focus is on preparing the property for public listing.

**Key Responsibilities & Permissions:**
*   **Marketing Queue:** Accesses the "My Marketing Tasks" queue to view properties assigned to them for a physical visit and marketing verification.
*   **Marketing Verification:** Conducts a site visit, takes high-quality photos, and confirms all property details.
*   **Image Management:** Can upload, edit, and reorder property photos.
*   **Mark as Verified:** After their visit, they mark the property as "Marketing Verified."
*   **Listing Management:** Has the authority to change a property's public listing status (i.e., make it visible or hidden on the public-facing website).

## 3.4 Telecalling Tenant Team

This role manages the initial interactions with potential tenants or buyers who express interest in a property.

**Key Responsibilities & Permissions:**
*   **Interaction Management:** Accesses the "Customer Interactions" module to view new visit requests from customers.
*   **Self-Assignment:** Can assign unassigned interactions to themselves.
*   **Tenant Verification:** Contacts the customer to confirm their interest, verify their details, and schedule a property visit.
*   **Scheduling:** After confirming with the customer, they update the interaction status to "Visit Confirmed," which notifies the Sales Team.
*   **Rental Applications:** Can view and manage the initial stages of rental applications submitted by customers they are handling.

## 3.5 Sales Team

The Sales Team is responsible for the physical property visits and guiding the customer through the final stages of a deal.

**Key Responsibilities & Permissions:**
*   **My Sales Visits:** Accesses a dedicated page to view all property visits assigned to them for the current day.
*   **Visit Management:** Responsible for meeting the customer at the property and conducting the tour.
*   **Update Visit Status:** After the visit, they must update the interaction status to either "Visit Completed" or "Visit Cancelled," providing feedback or a cancellation reason.
*   **Rental Application Support:** May assist customers in filling out rental applications, which are then managed by the telecalling and accounts teams.

## 3.6 Accounts Team

The Accounts Team handles all financial aspects of the platform, including visit plans, transactions, and rent management.

**Key Responsibilities & Permissions:**
*   **Plan Management:** Can create, edit, and manage **Visit Plans** and **Property Management Plans**.
*   **Transaction Monitoring:** Has full access to view all financial **Transactions** made by customers for purchasing visit plans.
*   **Rent Management:**
    *   Can create and manage **Rent Records** for all rental properties.
    *   Can view the **Rent Payments Overview**.
    *   Can access the **Occupancy & Rent Status** report to track dues and payments.
*   **Rental Application Payments:** Can update the status of rental applications to "Payment Confirmed" after verifying the security deposit has been received.

***


# Chapter 4: Managing Properties

The **Properties** module is the central repository for all property listings in the system. This chapter details how to navigate the property list, use the powerful filtering tools, and manage the entire lifecycle of a property from submission to listing.

## 4.1 The Property Workflow Tabs

The Properties page is organized into a series of workflow tabs. These tabs are designed to help different teams focus on the properties that require their immediate attention. The tabs you see will depend on your user role.

*   **All Properties:** A comprehensive view of every property in the system. Primarily used by Super Admins for oversight.
*   **Owner Contact Queue:** *(For Telecalling Owner Team)* Displays newly submitted properties that need an owner to be contacted for verification.
*   **My Owner Assignments:** *(For Telecalling Owner Team)* Shows properties that you have personally assigned to yourself for owner verification.
*   **Marketing Queue:** *(For Marketing Team & Super Admins)* Displays properties that have been verified by the owner telecalling team and are now ready for a marketing visit and photo shoot.
*   **My Marketing Tasks:** *(For Marketing Team)* Shows properties that have been assigned to you for a marketing visit.

## 4.2 Viewing and Filtering Properties

The main view on the Properties page is a powerful table that can be customized to find exactly what you're looking for.

### The Property List

Each row in the table provides a summary of a property, including:
*   **ID / Name:** A unique identifier and the property's given name.
*   **Location:** City and locality.
*   **Type/Listing:** Badges indicating if it's a House/Land and for Rent/Sale.
*   **Price / Adv.:** The listed price and any advance amount for rentals.
*   **Submitter / Tenant:** Quick links to the associated owner and tenant profiles.
*   **Assignments:** Shows which admins are assigned for owner and marketing contact.
*   **Admin Status:** The property's current stage in the internal verification workflow (e.g., `SUBMITTED`, `OWNER_VERIFIED`).
*   **Listed:** A toggle indicating if the property is live on the public website.
*   **Actions:** A set of buttons for editing, managing images/documents, and performing workflow actions.

### Filtering Properties

Above the property list is a collapsible filter section. Click the "Filter Properties" bar to expand it. You can search and filter by a wide range of criteria:

*   **Property & Listing Type:** Checkboxes to narrow down by House, Land, Rental, Sale, etc.
*   **Admin Status:** Filter by the internal workflow status (e.g., show only `MARKETING_VERIFIED` properties).
*   **Assignment Status:** Filter properties based on whether they are assigned or unassigned to a specific team (e.g., show only unassigned properties in the Marketing Queue). This is a powerful tool for workflow management.
*   **Price Range:** Set a minimum and maximum price.
*   **Location:** Filter by City or a comma-separated list of Pincodes.
*   **User Association:** Search for properties submitted by or tenanted by a specific user using a searchable select box.
*   **General Search:** A text box to search across multiple fields like ID, address, and owner name.

After setting your desired filters, click the **"Apply Filters"** button to update the list. Click **"Clear Filters"** to reset all fields.

## 4.3 Adding and Editing a Property

Whether you are creating a new property or editing an existing one, you will use the **Property Form Modal**.

> **Important: Editing Permissions**
>
> Please note that editing a property is a restricted action. You can only edit a property if:
> *   You are a **Super Admin**.
> *   You are an admin who is **currently assigned** to the property's active workflow stage (e.g., you are the assigned Telecaller for a property in `OWNER_CONTACT_PENDING` status).

1.  **To Add a New Property:** Click the **"List New Property"** button at the top of the Properties page.
2.  **To Edit an Existing Property:** Click the **Edit icon** (<kbd>✎</kbd>) in the "Actions" column for the desired property.

This will open a large modal window with several sections:

*   **Core Information:** The most critical details like Property Type, Listing Type, Price, Area, and Admin Status.
*   **Ownership & Management:** Link the property to a Submitter (Owner) and a Tenant (if occupied). You can also assign a Management Plan here.
*   **Location Details:** Set the full address and use the interactive map to pinpoint the exact coordinates.
*   **Type-Specific Details:** Depending on the selected `Property Type`, a specific section for "House," "Land," or "Building" details will appear, allowing you to enter relevant information like the number of bedrooms or plot dimensions.
*   **Availability & Features:** Set the availability status and toggle flags for listings.
    *   **Featured:** Toggling this on will highlight the property in special sections on the public-facing website, giving it more visibility.
    *   **Exclusive:** Toggling this on indicates that your company is the sole agent for this property, which may be displayed with a special badge to customers.
*   **Nearby Amenities:** Enter distances to nearby points of interest like hospitals and schools.
*   **Additional Information:** Add a public description, internal notes, and a YouTube link.
*   **Inventory Details:** Click the **"Edit Inventory Items"** button to open a sub-modal where you can add a list of included items like furniture and appliances.

After filling out the form, click **"Add Property"** or **"Update Property"** to save your changes.

## 4.4 Managing Property Images

Good photos are crucial for listings. The image manager allows you to upload, organize, and describe property photos.

1.  Click the **Photo icon** (<kbd>📷</kbd>) in the "Actions" column for the desired property.
2.  The **Manage Property Images & Documents** modal will open.

**Key Features:**
*   **Upload:** Drag and drop an image file into the dropzone or click to select a file. You can add an optional description and mark it as "Internal" if it should not be publicly visible.
*   **Reorder:** Simply drag and drop the image thumbnails to change their display order on the public listing. Click **"Save Current Order"** when finished.
*   **Edit:** Hover over an image and click the **Edit icon** (<kbd>✎</kbd>) to change its description.
*   **Delete:** Hover over an image and click the **Trash icon** (<kbd>🗑️</kbd>) to permanently delete it.
*   **Mark as Internal:** Use the **Eye icon** (<kbd>👁️</kbd>) to toggle an image's visibility between public and internal-only. Internal images are useful for documentation but won't be shown to customers.


## 4.5 Managing Property Documents

This feature allows you to securely store and manage important documents related to a property, accessible only to authorized admins.

1.  Click the **Paperclip icon** (<kbd>📎</kbd>) in the "Actions" column for the desired property.
2.  The **Manage Documents** modal will open.

**Key Features:**
*   **Upload:** Click the **"Upload"** button to reveal the upload form. Select a file, choose a `Document Type` (e.g., "Sale Deed"), and add an optional description.
*   **View & Download:** Click on a document's name or the download icon to view or download the file.
*   **Delete:** Click the **Trash icon** (<kbd>🗑️</kbd>) to permanently delete a document.

This feature is essential for the **Telecalling Owner Team** and **Marketing Team** during the property verification process.

## 4.6 Understanding the Property Details Page

For a complete 360-degree view of a single property, click on its address in the property list or use the **View Details** icon (<kbd>👁️</kbd>). This page aggregates all information related to the property into a single, comprehensive dashboard, including:

*   All core property details and specifics.
*   Ownership, management, and assignment information.
*   A gallery of public images and a list of internal documents.
*   Linked data such as **Interactions**, **Rent Records**, and **Support Tickets** associated with the property.

## 4.7 Automated Workflows

To improve efficiency and ensure tasks are distributed fairly, the system includes automated background processes for certain workflows.

### 4.7.1 Automated Marketing Assignments

Instead of requiring manual assignment, the system automatically assigns properties from the "Marketing Queue" to available marketing team members.

*   **How it Works:** Every five minutes, a background job scans for all properties with the status `OWNER_VERIFIED`.
*   **Assignment Logic:** For each property, the system uses a smart round-robin logic:
    1.  It first looks for marketers whose "Served Pincodes" match the property's pincode and assigns the task to the next person in that specific group.
    2.  If no marketers are assigned to that pincode, it falls back to a general round-robin pool of all available marketers.
*   **Outcome:** Once assigned, the property's status automatically changes to `MARKETING_VISIT_PENDING`, and it appears in the assigned marketer's **"My Marketing Tasks"** tab, ready for their action.

This automation ensures a steady and balanced flow of tasks to the marketing team without needing constant manual intervention from a manager or Super Admin.

***

# Chapter 5: Managing Customers

The **Customers** module serves as your central Customer Relationship Management (CRM) hub. It allows you to view, manage, and understand every user who interacts with your platform, whether they are property owners, tenants, or potential buyers.

## 5.1 Searching and Viewing Customers

The main Customers page provides a list of all users. You can quickly find specific customers using the search bar at the top of the page.

*   **Search:** Enter a customer's name, email address, or phone number to filter the list. The search results will update automatically as you type.
*   **Customer List:** The table displays key information for each customer at a glance:
    *   **Name / ID:** The customer's full name and a unique, copyable User ID.
    *   **Contact:** Their email and phone number.
    *   **Visits:** The remaining number of property visits on their active plan.
    *   **Expiry:** The expiry date of their current visit plan.
*   **Quick Actions:** Each row has a set of action buttons for quick management:
    *   <kbd>✎</kbd> **Edit Visits/Expiry:** Opens a modal to manually adjust the customer's visit balance and plan expiry date.
    *   <kbd>📋</kbd> **Edit Profile Details:** Opens a modal to edit custom profile attributes.
    *   <kbd>👁️</kbd> **View Full Details:** Navigates to the comprehensive Customer Details Page.

## 5.2 Understanding the Customer Details Page

Clicking on a customer's name or the "View Full Details" icon takes you to their detailed profile page. This page provides a complete 360-degree view of the customer's history and all their activities on the platform.

The page is divided into two main columns:

**Left Column (Primary Information):**
*   **Customer Info:** Displays the customer's name, contact details, visit balance, plan expiry, and system timestamps.
*   **Profile Details:** Shows custom attributes stored for the customer, such as their job, marital status, or budget. This information is editable.
*   **Customer Documents:** A dedicated section for uploading and managing documents specific to this customer (e.g., Aadhaar card, PAN card).

**Right Column (Related Data):**
This column contains a series of collapsible sections that show all records linked to this customer across the entire application:
*   **Owned Properties:** A list of all properties this user has submitted as an owner.
*   **Rented Properties (Tenant):** A list of properties this user is currently renting.
*   **Interactions:** All interactions this customer has had, such as wishlisting a property or scheduling a visit.
*   **Visit Plan Transactions:** A history of all visit plans they have purchased.
*   **Rent Records (as Landlord/Tenant):** Separate sections showing their rent history, both as a property owner and as a tenant.
*   **Raised Tickets:** A list of all support tickets they have created.

## 5.3 Editing Customer Visits & Expiry

This feature, typically used by the **Accounts Team** or **Super Admins**, allows for manual adjustments to a customer's visit plan.

1.  From the customer list or details page, click the **"Edit Visits/Expiry"** button.
2.  A modal window will appear with two fields:
    *   **Visit Balance:** Set the new number of visits the customer has remaining.
    *   **Expiry Date:** Set a new expiry date for their plan.
3.  Click **"Update Visits/Expiry"** to save the changes. This is useful for manually crediting visits or extending a plan as a goodwill gesture.

## 5.4 Editing Customer Profile Details

The system allows you to store flexible, key-value information on a customer's profile. This is managed through the JSON Editor modal.

1.  From the customer list or details page, click the **"Edit Profile Details"** button.
2.  A modal window will open, displaying all existing profile attributes.
3.  **To add a new attribute:**
    *   Use the **"Quick Add Attribute"** buttons (e.g., "Job," "Gender") for common fields.
    *   Click **"Add Custom Row"** to create a new, empty key-value pair.
4.  **To edit:** Simply type in the "Attribute Name" and "Value" fields.
5.  Click **"Save Details"** to apply your changes.

This feature is particularly useful for telecalling teams to capture important customer information during conversations.

## 5.5 Managing Customer Documents

Similar to property documents, you can store documents that are specific to a customer, such as identity verification.

1.  Navigate to the **Customer Details Page**.
2.  Find the **"Customer Documents"** card.
3.  **To Upload:** Click the **"Upload"** button, select a file, choose the appropriate `Document Type` from the dropdown, and add an optional description.
4.  **To View/Download:** Click the document name or the download icon.
5.  **To Delete:** Click the trash icon next to the document you wish to remove.

This centralized document storage ensures that all relevant customer information is securely kept and easily accessible to authorized admins.

***

# Chapter 6: Core Workflows

The Admin Panel is more than just a collection of data management pages; it's a tool designed to guide your teams through complex, multi-step workflows. This chapter explains the primary operational processes and how different teams collaborate within the system to move tasks from start to finish.

## 6.1 Property Onboarding Workflow

This workflow describes the journey of a property from the moment it is submitted by an owner to the point where it is fully verified and ready to be listed publicly. It ensures quality control and proper documentation before any property goes live.

**Roles Involved:** Property Owner (Submitter), Telecalling Owner Team, Marketing Team, Super Admin.

### 6.1.1 Owner Telecalling: Assigning & Verifying Properties

This is the first stage of the internal verification process.

1.  **Submission:** A new property enters the system with the status `SUBMITTED`. It immediately appears in the **"Owner Contact Queue"** tab on the **Properties** page.
2.  **Assignment:** A member of the **Telecalling Owner Team** navigates to this queue and clicks the **"Assign to Self"** icon (<kbd>👤+</kbd>). This action assigns the property to them, changing its status to `OWNER_CONTACT_PENDING` and moving it to their personal **"My Owner Assignments"** tab.
3.  **Verification:** The assigned telecaller is now responsible for:
    *   Contacting the property owner to verify all submitted details.
    *   Requesting and uploading necessary legal documents (e.g., Sale Deed, Tax Receipts) via the **Document Manager** (<kbd>📎</kbd>).
4.  **Completion:** Once verification is complete, the telecaller clicks the **"Mark Owner Verified"** button (<kbd>✓</kbd>). This changes the property's status to `OWNER_VERIFIED`.

### 6.1.2 Marketing Team: Assigning & Verifying Properties

Once the owner and documents are verified, the property moves to the marketing stage for physical verification and content creation.

1.  **Marketing Queue:** A property with `OWNER_VERIFIED` status automatically appears in the **"Marketing Queue"**.
2.  **Assignment:** The System or a Super Admin can assigns the property to a member of the **Marketing Team**. The property's status changes to `MARKETING_VISIT_PENDING`, and it appears in the assigned marketer's **"My Marketing Tasks"** tab.
3.  **Site Visit & Content:** The marketer conducts a site visit to:
    *   Physically verify the property's condition and details.
    *   Take high-quality photographs and upload them using the **Image Manager** (<kbd>📷</kbd>).
4.  **Final Verification:** After the visit, the marketer clicks the **"Mark Marketing Verified"** button. The property's status is now updated to `MARKETING_VERIFIED`. It is considered fully vetted and ready to be made public.
5.  **Go Live:** An authorized user (Marketing Team or Super Admin) can now toggle the **"Listed"** switch on the property list to make it live on the public website.

## 6.2 Customer Interaction & Sales Workflow

This workflow covers the process of handling a potential tenant or buyer's interest in a property, from their initial request to a completed site visit.

**Roles Involved:** Customer, Telecalling Tenant Team, Sales Team.

### 6.2.1 Tenant Telecalling: Handling Visit Requests

This stage is managed by the tenant-focused telecalling team to qualify leads and schedule visits.

1.  **Visit Request:** A customer requests a visit to a property. An **Interaction** record is created with the status `VISIT_PENDING` and appears in the **"Assignable to Me"** queue on the **Interactions** page.
2.  **Assignment:** A **Telecalling Tenant Team** member self-assigns the interaction.
3.  **Confirmation:** The telecaller contacts the customer to confirm their interest and schedule a visit time.
4.  **Handover to Sales:** After confirming with the customer, the telecaller clicks the **"Mark Tenant Verified"** button (<kbd>✓</kbd>). The interaction status changes to `VISIT_CONFIRMED_PENDING_SALES`, indicating it's ready for a sales agent.

### 6.2.2 Sales Team: Managing "My Sales Visits"

This stage is handled by the on-field sales team.

1.  **Viewing Tasks:** Once a visit has been assigned (see section 6.2.3 below), the sales agent sees this appointment on their personal **"My Sales Visits"** page, which shows all their visits for a selected date.
2.  **Conducting the Visit:** The agent meets the customer and conducts the property tour.
3.  **Updating Status:** After the visit, the agent **must** update the interaction status:
    *   **Mark Completed:** Opens a modal to add feedback on the customer's interest.
    *   **Mark Cancelled:** Prompts for a mandatory reason for cancellation.

### 6.2.3 Automated Sales Visit Assignments

To ensure that confirmed customer visits are promptly assigned to the sales team, the system uses an automated background process.

*   **How it Works:** Every five minutes, a background job scans for all customer interactions that are in the `VISIT_CONFIRMED_PENDING_SALES` status.
*   **Assignment Logic:** The system groups all pending visits for a single customer on a given day and assigns them to an available sales team member. It attempts to find a sales agent whose "Served Pincodes" match the properties in the visit group. If no specific agent is available, it will assign the group to any active sales agent.
*   **Outcome:** Once assigned, the interaction status is automatically updated to `VISIT_SCHEDULED_WITH_SALES`. The visit then immediately appears on the assigned agent's **"My Sales Visits"** page, ready for them to conduct the tour. This automation eliminates the need for manual assignment and ensures a rapid response to customer requests.

## 6.3 Rental Application Workflow

This workflow begins after a customer decides to rent a property and submits an application.

**Roles Involved:** Customer, Telecalling Teams, Accounts Team, Super Admin.

### 6.3.1 Managing Applications

This covers the initial review and internal processing of a submitted application.

1.  **Submission:** An application is submitted by a customer and appears in the **"New & Unassigned"** queue with the status `SUBMITTED`.
2.  **Review:** An admin assigns the application to themselves, and the status changes to `REVIEW_IN_PROGRESS`. They are now responsible for moving it through the subsequent stages, such as `AWAITING_LANDLORD_CONTACT`, `LANDLORD_APPROVED`, and `DOCUMENTS_VERIFIED`, by updating the status in the **Rental Application Detail Modal**.

### 6.3.2 Assigning Applications

Applications must be assigned to an admin to be processed.

*   **Self-Assignment:** A **Telecalling Team** member can claim an unassigned application from the queue.
*   **Super Admin Assignment:** A **Super Admin** can manually assign any application to any eligible admin at any time from the application's detail modal.

### 6.3.3 Finalizing a Lease

This is the final and most critical stage of the rental workflow.

1.  **Awaiting Payment:** Once an application is fully approved, its status is set to `APPROVED_AWAITING_PAYMENT`. This signals the **Accounts Team** to collect the payment.
2.  **Payment Confirmation:** The Accounts Team updates the status to `PAYMENT_CONFIRMED` upon successful payment.
3.  **Finalize Lease:** An authorized admin clicks the **"Finalize Lease & Assign Tenant"** button. This single action automates several crucial updates:
    *   The property's status is set to `RENTED`.
    *   The applicant is officially linked as the `tenant` of the property.
    *   The application status is set to `TENANCY_ACTIVE`.
    *   The original customer interaction that started the process is updated to `LEASE_CONVERTED`.

This workflow begins after a customer decides to rent a property and submits an application.

**Roles Involved:** Customer, Telecalling Teams, Accounts Team, Super Admin.


This is the final and most critical stage of the rental workflow.

1.  **Awaiting Payment:** Once an application is fully approved, its status is set to `APPROVED_AWAITING_PAYMENT`. This signals the **Accounts Team** to collect the payment.
2.  **Payment Confirmation:** The Accounts Team updates the status to `PAYMENT_CONFIRMED` upon successful payment.
3.  **Finalize Lease:** An authorized admin clicks the **"Finalize Lease & Assign Tenant"** button. This single action automates several crucial updates:
    *   The property's status is set to `RENTED`.
    *   The applicant is officially linked as the `tenant` of the property.
    *   The application status is set to `TENANCY_ACTIVE`.
    *   The original customer interaction that started the process is updated to `LEASE_CONVERTED`.

***

# Chapter 7: Financial & Rent Management

This chapter covers the modules primarily used by the **Accounts Team** and **Super Admins** to manage the financial aspects of the business, from customer-facing plans to internal rent collection and property management agreements.

## 7.1 Managing Visit Plans

Visit Plans are prepaid packages that customers can purchase to get a specific number of property visits.

**Navigation:** Access this module via `Sidebar > Visit Plans`.

### Creating and Editing Visit Plans
1.  **To Add a New Plan:** Click the **"Add New Plan"** button.
2.  **To Edit an Existing Plan:** Click the **Edit icon** (<kbd>✎</kbd>) next to the desired plan.

In the modal window, you can configure the following:
*   **Plan Name:** A descriptive name (e.g., "Basic Plan," "Pro Explorer").
*   **Description:** A brief explanation of the plan's benefits.
*   **Number of Visits:** The quantity of property visits included in the plan.
*   **Price (₹):** The cost of the plan in Indian Rupees.
*   **Active:** Use the toggle switch to make the plan available for purchase by customers. Inactive plans will not be visible on the customer-facing portal.

## 7.2 Viewing Transactions

The Transactions module provides a comprehensive log of all payments made by customers for purchasing Visit Plans.

**Navigation:** Access this module via `Sidebar > Transactions`.

### The Transaction List
The table displays detailed information for each transaction:
*   **Transaction ID:** A unique ID for the payment record.
*   **Customer:** The name and contact details of the customer who made the purchase.
*   **Plan:** The name of the Visit Plan that was purchased.
*   **Amount:** The transaction amount.
*   **Status:** The payment status from the payment gateway (e.g., `paid`, `failed`, `created`).
*   **Created At:** The timestamp when the transaction was initiated.

You can click on a customer's name to expand the row and view more technical details, including the `Razorpay Order ID` and `Payment ID`.

### Filtering Transactions
Use the filter bar at the top to search for specific transactions by User ID, Plan ID, status, or date range.

## 7.3 Managing Property Management Plans

These are internal service agreements that define the commission percentage your company takes for managing a property. These plans are later assigned to individual properties.

**Navigation:** Access this module via `Sidebar > Mgmt. Plans`.

### Creating and Editing Management Plans
The process is nearly identical to managing Visit Plans:
1.  Click **"Add New Plan"** or the **Edit icon** (<kbd>✎</kbd>).
2.  In the modal, define:
    *   **Plan Name:** An internal name for the agreement (e.g., "Standard 8%," "Premium Service").
    *   **Percentage (%):** The commission rate.
    *   **Description:** Details about the services included in this plan.
    *   **Active:** Toggle whether this plan can be assigned to new properties.

## 7.4 Managing Rent Records

This module is the core of your rent collection operations. It allows you to generate, track, and manage monthly rent dues for all occupied rental properties.

**Navigation:** Access this module via `Sidebar > Rent Records`.

### 7.4.1 Creating and Editing Rent Records
While the system can be configured to automatically generate upcoming rent records, you can also manage them manually.

*   **To Add a Record:** Click **"Add New Rent Record"**. You must select a property that has an assigned tenant. The system will then automatically populate the landlord and tenant details.
*   **To Edit a Record:** Click the **Edit icon** (<kbd>✎</kbd>) on an existing record.

**Key Fields:**
*   **Due Date:** The date the rent payment is due.
*   **Period Start/End Date:** The rental period this payment covers.
*   **Amount Due:** The total rent amount for the period.
*   **Amount Paid:** This field is typically updated automatically when payments are recorded but can be adjusted manually by an admin.
*   **Status:** The current status of the record (`DUE`, `PAID`, `OVERDUE`, etc.). This is also updated automatically based on payments.

### 7.4.2 Recording and Deleting Payments
To view and manage payments for a specific rent period, click the **View Details icon** (<kbd>👁️</kbd>) on any record. This opens the **Rent Record Details Modal**.

*   **Record a Payment:**
    1.  Click the **"Record Payment"** button to open the payment form.
    2.  Select the user who paid (typically the tenant).
    3.  Enter the `Amount`, `Payment Date`, and `Payment Method`.
    4.  Click **"Save Payment"**. The system will automatically update the `Amount Paid` and `Status` of the parent rent record.
*   **Delete a Payment:** If a payment was recorded in error, you can click the **Trash icon** (<kbd>🗑️</kbd>) next to it in the payments table. This will also trigger the system to recalculate the rent record's status.

## 7.5 Viewing Rent Payments Overview

**Navigation:** Access this module via `Sidebar > Payments Overview`.

This page provides a high-level, filterable list of all rent records. It is designed to give a quick overview of all rental activities without the detailed management actions found on the "Rent Records" page. Think of it as a read-only report for quickly finding payment information.

## 7.6 Occupancy & Rent Status Report

**Navigation:** Access this module via `Sidebar > Occupancy`.

This is a specialized report that provides a snapshot of every currently **occupied** rental property and the status of its **latest** rent payment record.

**Key Features:**
*   **Purpose:** Quickly identify which tenants are overdue on their most recent rent payment.
*   **View Payment History:** Click the **View History icon** (<kbd>👁️</kbd>) to open a modal showing the complete payment history for that property, across all rent records, not just the latest one.
*   **Filtering:** You can filter the list by property details, tenant details, or the status of the latest rent record (e.g., show only properties where the latest rent is `OVERDUE`).

This report is essential for proactive rent management and follow-ups.

***

# Chapter 8: Support & Vendor Management

This chapter details the modules designed for managing internal support operations and external service providers. These tools are crucial for resolving customer issues efficiently and coordinating with third-party vendors.

## 8.1 Managing Support Tickets

The **Tickets** module is a full-featured helpdesk system for tracking and resolving issues raised by customers (both property owners and tenants).

**Navigation:** Access this module via `Sidebar > Tickets`.

### 8.1.1 The Ticket Workflow Tabs

Similar to the Properties module, the Tickets page is organized into workflow tabs to help support staff manage their workload effectively.

*   **All Tickets:** A complete view of every ticket in the system, filterable by status, priority, assignee, and more. Primarily for Super Admin oversight.
*   **Unassigned:** This is the queue for all new tickets that have not yet been assigned to an admin or vendor. This is the starting point for the support workflow.
*   **My Tickets:** Shows all tickets that are currently assigned directly to you for resolution.
*   **All Open/In Progress:** A consolidated view of all tickets that are currently active, regardless of who they are assigned to.

### 8.1.2 Viewing and Editing a Ticket

To work on a ticket, click the **View/Edit icon** (<kbd>👁️</kbd>) from any ticket list. This opens the comprehensive **Ticket Form Modal**.

**Key Sections of the Ticket Modal:**
*   **Ticket Details:** Displays the customer who raised the ticket and the property it relates to. You can edit the `Subject` here. The original `Description` is read-only for historical accuracy.
*   **Classification & Status:**
    *   **Category:** Classify the ticket (e.g., "Plumbing," "Lease Query").
    *   **Priority:** Set the urgency (`Low`, `Medium`, `High`).
    *   **Status:** Update the ticket's progress (e.g., `OPEN`, `IN_PROGRESS`, `RESOLVED`).
*   **Assignment:**
    *   **Assign to Admin:** Assign the ticket to another internal admin user.
    *   **Assign to Vendor:** Assign the ticket to an external service vendor for resolution.
*   **Resolution:** Enter final resolution notes here when the issue is solved.
*   **Images & Comments:**
    *   **Images:** View images uploaded by the customer or upload new ones for clarification.
    *   **Comments:** This is the communication log. You can add public comments (visible to the customer) or internal notes (visible only to admins).

### 8.1.3 Assigning Tickets

Proper ticket assignment is key to efficient resolution.

1.  **Self-Assignment:** From the **"Unassigned"** tab, a telecalling team member can click the **Assign to Self icon** (<kbd>👤+</kbd>) to take ownership of a new ticket.
2.  **Manual Assignment (in Modal):**
    *   **To Admin:** Inside the Ticket Form Modal, use the "Assign to Admin" searchable dropdown to find and select an internal team member.
    *   **To Vendor:** Use the "Assign to Vendor" dropdown to select an approved external vendor. Assigning to a vendor will automatically un-assign any admin.

When a ticket is resolved, change its status to `RESOLVED`. If the customer confirms the resolution, it can then be moved to `CLOSED`.

## 8.2 Managing Vendors

The **Vendors** module is your directory of approved third-party service providers (e.g., plumbers, electricians, cleaning services).

**Navigation:** Access this module via `Sidebar > Vendors`.

### Creating and Editing Vendors
1.  **To Add a New Vendor:** Click the **"Add New Vendor"** button.
2.  **To Edit an Existing Vendor:** Click the **Edit icon** (<kbd>✎</kbd>) next to the desired vendor.

In the **Vendor Form Modal**, you can manage:
*   **Vendor Information:** Company name, contact person, phone, email, and address.
*   **Status:** Set the vendor's status (`ACTIVE`, `INACTIVE`, `UNDER_REVIEW`).
*   **Assign Services:** In the "Assign Services" section, you can check the boxes next to all services that this vendor is qualified to perform. This list is populated from the Services module.

### Viewing Vendor Details
Clicking the **View Details icon** (<kbd>👁️</kbd>) opens a modal with a read-only summary of the vendor's information and a clear list of all the services they offer.

## 8.3 Managing Services

The **Services** module allows you to define a standardized list of all possible services that can be assigned to vendors. This ensures consistency across the platform.

**Navigation:** Access this module via `Sidebar > Services`.

### Creating and Editing Services
1.  **To Add a New Service:** Click the **"Add New Service"** button.
2.  **To Edit an Existing Service:** Click the **Edit icon** (<kbd>✎</kbd>) next to the desired service.

In the **Service Form Modal**, you can set:
*   **Service Name:** The official name of the service (e.g., "AC Repair," "Deep Cleaning").
*   **Description:** An optional, brief description of what the service entails.
*   **Category:** Group the service into a logical category (e.g., "MAINTENANCE," "REPAIR," "CLEANING") for better organization.

Maintaining a clean and well-defined list of services makes it easier to manage vendor assignments and generate reports on ticket types.

***

# Chapter 9: System Administration (Super Admin)

This chapter covers features that are exclusively available to users with the **Super Admin** role. These tools are critical for managing the system's users, maintaining security, and ensuring the smooth operation of the platform.

## 9.1 Managing Admin Users

Super Admins have the sole authority to manage other administrative user accounts. This is done from the **Admins** module.

**Navigation:** Access this module via `Sidebar > Admins`.

### Adding a New Admin

You cannot create a user from scratch within the Admin Panel. Instead, you grant administrative privileges to an existing user who has already signed up and has an account in the system.

1.  **Search for a User:** In the "Add New Admin by Searching Users" section, enter the user's name, email, or phone number and click **"Search"**.
2.  **Find the User:** The system will display a list of matching users who are *not* currently admins.
3.  **Assign Roles:** Click the **"Assign Roles"** button next to the correct user. This will open the **Admin Form Modal**.

### Editing an Existing Admin

To modify an existing admin's roles or details:
1.  Find the admin in the "Current Admins" list.
2.  Click the **Edit icon** (<kbd>✎</kbd>) in their row to open the **Admin Form Modal**.

## 9.2 Assigning Roles and Pincodes

The **Admin Form Modal** is the central place to control an admin's permissions and operational area.

**Key Fields in the Modal:**
*   **Admin Roles:** A list of all available roles in the system. Check the boxes to grant the user the corresponding permissions. You can assign multiple roles to a single user.
    *   **Warning:** Removing all roles from a user will effectively revoke their admin access and remove them from the admin list.
*   **Served Pincodes:** Enter a comma-separated list of postal pincodes that this admin is responsible for. This is primarily used by the system's logic for automatically assigning tasks to the Marketing Team.
*   **Active Status:** This switch controls whether the admin account is active or inactive.
    *   **Active:** The user can log in and perform actions based on their assigned roles.
    *   **Inactive:** The user will be unable to log in to the Admin Panel. This is the preferred way to temporarily suspend access without deleting their roles.

### Deactivating and Removing Admins

*   **To Deactivate:** Use the **Active Status** switch in the Admin Form Modal or click the **Deactivate icon** (<kbd>🚫</kbd>) in the admin list for a quicker toggle.
*   **To Remove All Roles:** Click the **Trash icon** (<kbd>🗑️</kbd>) in the admin list. This action will remove all assigned roles, effectively deleting them as an admin. The user's account will still exist in the system, but they will no longer have any administrative privileges.

> **Security Best Practice:** Regularly review the list of active admins and their assigned roles to ensure that permissions are aligned with current responsibilities. Deactivate accounts for employees who no longer require access.

***

# Chapter 10: Automated SMS Notifications

## 10.1 Introduction to Automated Notifications

The Admin Panel includes a powerful automated notification system designed to streamline communication and reduce manual follow-ups. This system automatically sends SMS messages to key stakeholders—including customers, property owners, admins, and vendors—at critical points in your operational workflows.

These notifications are triggered by specific actions performed within the Admin Panel, such as assigning a task, changing a property's status, or closing a support ticket. As an admin, you do not need to send these messages manually; the system handles it for you.

The primary benefits of this system are:
*   **Improved Communication:** Keeps everyone informed in real-time.
*   **Increased Efficiency:** Reduces the need for manual phone calls and emails to provide simple status updates.
*   **Enhanced Experience:** Provides a professional and responsive experience for your customers and partners.

This chapter outlines the key events that trigger these automated SMS notifications, who receives them, and the purpose of each message.

## 10.2 Property Workflow Notifications

This section details the SMS alerts related to the property onboarding and rental lifecycle, ensuring owners and team members are kept in the loop.

### 10.2.1 Property Submission Confirmation (`POST_SUBMITTED`)

*   **Trigger Event:** When a property owner successfully submits a new property listing through the customer portal.
*   **Recipient:** The property owner.
*   **Purpose:** This initial message serves as an immediate confirmation to the owner that their property submission has been received successfully. It assures them that their listing is now in the internal review queue and will be processed by the team shortly.

### 10.2.2 Marketing Assignment Notifications

*   **Trigger Event:** When a property is assigned (or re-assigned) to a member of the Marketing Team for a site visit.
*   **Recipients:**
    1.  The **property owner** (`MARKETING_ASSIGNED_TO_CUSTOMER` or `MARKETING_REASSIGNED_TO_CUSTOMER`).
    2.  The newly **assigned marketer** (`MARKETING_ASSIGNED_TO_MARKETER`).
*   **Purpose:** This is a two-way notification. The property owner receives an SMS informing them that a specific marketing executive, whose name is included in the message, will be in touch to schedule a visit. This builds trust and sets clear expectations. Simultaneously, the assigned marketer receives an alert notifying them of their new task.

### 10.2.3 Property Rented Notifications

*   **Trigger Event:** When an admin finalizes a lease from a rental application, and the property's `admin_status` is officially changed to `RENTED`.
*   **Recipients:**
    1.  The new **tenant** (`RENT_APPROVAL_TO_CUSTOMER`).
    2.  The **property owner** (`RENTED_APPROVAL_TO_OWNER`).
*   **Purpose:** The tenant receives a welcome message confirming that their application has been fully approved and the property is now officially theirs to rent. The owner receives a notification confirming that their property has been successfully rented, providing them with peace of mind and concluding the listing process.


## 10.3 Customer Interaction & Sales Notifications

This section covers the automated alerts sent during the customer's journey from scheduling a property visit to meeting with the sales team.

### 10.3.1 Visit Scheduled Confirmation

*   **Trigger Event:** When a customer's visit request is fully confirmed and assigned to a sales agent (specifically, when the interaction status is updated to `VISIT_SCHEDULED_WITH_SALES`).
*   **Recipients:**
    1.  The **property owner** (`VISIT_BOOKING_TO_OWNER`).
    2.  The **customer** (prospective tenant/buyer) (`VISIT_BOOKING_TO_TENANT`).
*   **Purpose:** This notification coordinates the visit for all parties. The property owner is alerted about the scheduled date, ensuring they are aware of the appointment. The customer receives a final confirmation of their visit, which includes the property address, the scheduled date, and the name of the sales executive who will be meeting them.

## 10.4 Financial Notifications

This section details the SMS alerts related to customer payments and rent dues, handled primarily by the Accounts Team's workflows.

### 10.4.1 Visit Plan Purchase Confirmation (`CREDITS_PURCHASED`)

*   **Trigger Event:** After a customer successfully completes a payment for a visit plan and the corresponding transaction in the system is marked as `paid`.
*   **Recipient:** The customer who made the purchase.
*   **Purpose:** This serves as a digital receipt and confirmation. The SMS informs the customer that their payment was successful, states the amount paid, and—most importantly—updates them with their new total visit balance.

### 10.4.2 Rent Due Reminder (`RENT_DUE`)

*   **Trigger Event:** When a new `Rent Record` is created for an occupied property. This is typically done by the automated daily job that generates upcoming rent dues.
*   **Recipient:** The tenant of the property.
*   **Purpose:** This is a proactive reminder sent to the tenant about their upcoming rent payment. The message includes the property address, the specific due date, and the amount due, helping to reduce late payments.

## 10.5 Support Ticket Notifications

This section covers all automated alerts related to the support ticket system, ensuring transparency for customers and vendors.

### 10.5.1 Ticket Creation & Closure

*   **Trigger Events:**
    1.  When a customer creates a new support ticket (`TICKET_CREATED`).
    2.  When an admin changes a ticket's status to `CLOSED`.
*   **Recipient:** The customer who raised the ticket.
*   **Purpose:** The first SMS provides the customer with immediate acknowledgment that their support request has been successfully logged. The second SMS informs them once the issue has been fully resolved and the ticket is officially closed in the system, concluding the support interaction.

### 10.5.2 Vendor Assignment Notifications

*   **Trigger Event:** When an admin assigns a support ticket to an external service vendor for resolution.
*   **Recipients:**
    1.  The assigned **vendor** (`TICKET_ASSIGNED_TO_VENDOR`).
    2.  The **customer who raised the ticket** (`TICKET_VENDOR_DETAILS_TO_RAISER`).
*   **Purpose:** This is a critical coordination message. The vendor receives a notification alerting them to a new job assignment. At the same time, the customer is informed which company will be handling their service request, along with their ticket ID for reference. This keeps the customer in the loop and improves transparency.

***

# Appendix A: Glossary of Statuses

This appendix provides a quick reference for the various statuses used throughout the application. Understanding these statuses is key to tracking the progress of properties, interactions, and tasks within the system's workflows.

## A.1 Property Admin Statuses

These statuses track the internal verification and listing lifecycle of a property.

*   **`SUBMITTED`:** The initial status of a property after it has been added to the system. It is now waiting in the "Owner Contact Queue" for a telecaller.
*   **`OWNER_CONTACT_PENDING`:** A telecaller has been assigned to the property and is in the process of contacting the owner for verification.
*   **`OWNER_VERIFIED`:** The telecaller has successfully verified the property details with the owner and uploaded necessary documents. The property is now in the "Marketing Queue."
*   **`MARKETING_VISIT_PENDING`:** A marketing team member has been assigned to conduct a physical visit, take photos, and verify the property on-site.
*   **`MARKETING_VERIFIED`:** The marketing team has completed their visit and uploaded photos. The property is now fully vetted and ready for public listing.
*   **`AWAITING_LISTING`:** A temporary status indicating the property is verified and is pending its first public listing toggle.
*   **`REJECTED`:** The property has been rejected during the verification process and will not be listed.
*   **`SUSPENDED`:** The property has been temporarily removed from public view by an admin.
*   **`RENTED`:** The property has been successfully rented out and is no longer available.
*   **`SOLD`:** The property has been sold and is no longer available.

## A.2 Interaction Statuses

These statuses track the journey of a customer's interaction with a specific property.

*   **`WISHLISTED`:** The customer has shown initial interest (e.g., saved to a wishlist).
*   **`VISIT_PENDING`:** The customer has formally requested a visit. The request is now in the "Assignable to Me" queue for the tenant telecalling team.
*   **`VISIT_CONFIRMED_PENDING_SALES`:** A telecaller has confirmed the visit with the customer. The interaction is now waiting to be assigned to a sales agent.
*   **`VISIT_SCHEDULED_WITH_SALES`:** A sales agent has been assigned to the visit. It will appear on their "My Sales Visits" page.
*   **`VISIT_COMPLETED`:** The sales agent has conducted the visit and marked it as complete.
*   **`VISIT_CANCELLED`:** The visit was cancelled by the sales agent or customer.
*   **`RENTAL_APPLICATION_SUBMITTED`:** The customer has submitted a rental application for the property following the visit.
*   **`LEASE_CONVERTED`:** The rental application was successful, and a lease has been finalized. This is the final stage.

## A.3 Rental Application Statuses

These statuses track the detailed workflow of a customer's application to rent a property.

*   **`SUBMITTED`:** The initial status when a customer submits an application. It is now in the "New & Unassigned" queue.
*   **`REVIEW_IN_PROGRESS`:** An admin has been assigned and is actively reviewing the application.
*   **`AWAITING_LANDLORD_CONTACT`:** The admin is in the process of contacting the property owner for their approval.
*   **`LANDLORD_APPROVED` / `LANDLORD_REJECTED`:** The landlord has either approved or rejected the applicant.
*   **`DOCUMENTS_REQUESTED`:** The admin has requested additional documents from the applicant.
*   **`DOCUMENTS_VERIFIED`:** All requested documents have been received and verified.
*   **`APPROVED_AWAITING_PAYMENT`:** The application is fully approved, and the system is now waiting for the Accounts Team to confirm receipt of the security deposit.
*   **`PAYMENT_CONFIRMED`:** The Accounts Team has confirmed that the payment has been received.
*   **`LEASE_FINALIZED` / `TENANCY_ACTIVE`:** The lease has been finalized, and the property is officially rented to the applicant. The property's status is updated to `RENTED`.
*   **`APPLICATION_WITHDRAWN_CUSTOMER`:** The customer has withdrawn their application.
*   **`CANCELLED_ADMIN`:** An admin has cancelled the application.

## A.4 Ticket Statuses

These statuses track the lifecycle of a customer support request.

*   **`NEW`:** The initial status of a newly created ticket.
*   **`OPEN`:** The ticket has been acknowledged and is waiting to be assigned.
*   **`ASSIGNED`:** The ticket has been assigned to either an internal admin or an external vendor.
*   **`WAITING_TENANT_RESPONSE` / `WAITING_OWNER_RESPONSE`:** The support agent is waiting for a reply from the customer.
*   **`IN_PROGRESS`:** The assigned agent or vendor is actively working on a solution.
*   **`RESOLVED`:** A solution has been provided, and the ticket is pending closure confirmation from the customer.
*   **`CLOSED`:** The issue has been resolved, and the case is closed.
*   **`CANCELLED`:** The ticket has been cancelled.

## A.5 Rent Statuses

These statuses apply to individual monthly `Rent Records`.

*   **`DUE`:** The rent record has been generated, but the payment due date has not yet passed.
*   **`PAID`:** The full rent amount has been paid.
*   **`PARTIALLY_PAID`:** A partial payment has been made, but there is still a remaining balance.
*   **`OVERDUE`:** The due date has passed, and the full rent amount has not been paid.
*   **`CANCELLED`:** The rent record has been cancelled by an admin and is no longer due.#   v e e d u - 3 6 0 - c l i e n t  
 #   v e e d u - 3 6 0 - a d m i n  
 