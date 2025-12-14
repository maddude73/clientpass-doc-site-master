---
id: 693f2168738b45ea67ad1ba2
revision: 1
---
# System Design Document

**Last Updated**: November 8, 2025

## 1. Introduction

### 1.1 Purpose

This document provides a detailed system design for the ClientPass application. It expands on the **Software Requirements Specification (SRS)** by detailing the technical implementation of each requirement, including the components, data models, and functions involved. It is intended for the development team to use as a guide for implementation.

### 1.2 Scope

This document covers the detailed design of the frontend and backend components required to meet the functional and non-functional requirements outlined in the SRS.

## 2. System Architecture

The overall system architecture is described in the **Software Architecture Document (SAD.md)** and the **Architecture Overview (ARCHITECTURE.md)**. This document will focus on the design of the specific modules and components within that architecture.

## 3. Detailed Functional Design

This section breaks down the functional requirements from the SRS into their constituent design elements.

### 3.1 User Authentication & Onboarding

Corresponds to SRS Section 3.1.1.

- **Frontend Components**:
  - `SignUpForm.tsx`: Handles user registration.
  - `LoginForm.tsx`: Handles user login.
  - `useAuthStore.ts`: A Zustand store to manage global authentication state, user profile, and session information.
- **Data Models**:
  - `public.users`: The primary table for user profile data.
  - `auth.users`: Supabase's built-in table for authentication credentials.
  - `public.docs_users`: For documentation site access.
  - `public.docs_invites`: For invitation-only access to the documentation site.
- **Edge Functions**:
  - `upsert-profile`: Called after sign-up to create a corresponding profile in the `users` table.
  - `send-doc-invite`: For admins to send email invitations to the documentation site.
- **User Flow**:
  1.  A new user signs up using the `SignUpForm`.
  2.  Supabase Auth handles the email verification process.
  3.  Upon first login, the `upsert-profile` function is triggered to create a user record.
  4.  The user's session and profile are stored in the `useAuthStore`.

### 3.2 Referral Management

Corresponds to SRS Section 3.1.2.

- **Frontend Components**:
  - `ReferralForm.tsx`: A form for creating and sending a new referral.
  - `ReferralCard.tsx`: A component to display the status and details of a referral.
  - `CountdownTimer.tsx`: A component to show the real-time expiration timer for a pending referral.
- **Data Models**:
  - `public.referrals`: The central table for all referral data, now includes `service_id` to support the new service taxonomy.
  - `public.users`: To link senders and receivers.
  - `public.services`: To specify the service being referred.
- **Edge Functions**:
  - `send-referral`: The primary function for initiating a referral. It finds a suitable receiver and creates the referral record.
  - `reassign-referral`: Triggered when a referral is declined or expires, to find the next available professional.
  - `inbox-action`: Handles the "accept" or "decline" actions from the receiver.
- **User Flow**:
  1.  A stylist fills out the `ReferralForm`.
  2.  The `send-referral` function is invoked.
  3.  The system identifies a receiver and creates a `referrals` record with a `pending` status.
  4.  The receiver is notified in real-time (via Supabase Realtime) and sees the referral in their inbox with a `CountdownTimer`.
  5.  The receiver accepts or declines via the `inbox-action` function.

### 3.3 Open Chair Marketplace

Corresponds to SRS Section 3.1.3.

- **Frontend Components**:
  - `PostOpenChairForm.tsx`: A form for hosts to list their available chair.
  - `OpenChairAlerts.tsx`: A view for stylists to browse and accept open chairs.
  - `LiveSessionCard.tsx`: A dashboard component that appears during a live session.
- **Data Models**:
  - `public.open_chairs`: Stores all data related to open chair listings.
  - `public.referrals`: Bookings made into an open chair are linked via the `open_chair_id`.
  - `public.users`: To link hosts and visiting stylists.
- **Edge Functions**:
  - `post-open-chair`: Creates a new `open_chairs` listing.
  - `accept-open-chair`: Allows a stylist to initiate the acceptance of an open chair.
  - `confirm-open-chair`: Confirms the acceptance within a time window.
  - `check-in-open-chair`: Starts the "live" session.
  - `end-open-chair-session`: Ends the session and triggers settlement.
  - `settle-open-chair-commission`: Calculates and records the commission splits.

### 3.4 Hot Seat (Flash Sales)

Corresponds to SRS Section 3.1.4.

- **Frontend Components**:
  - `PostHotSeatForm.tsx`: A form for creating a "Hot Seat" alert.
  - `HotSeatCard.tsx`: A component to display a Hot Seat offer.
- **Data Models**:
  - `public.hot_seats`: Stores all data for Hot Seat offers.
  - `public.users`: To link the stylist posting the offer.
  - `public.services`: To specify the service offered.
- **Edge Functions**:
  - `post-hot-seat` (to be created): Will handle the creation of a new `hot_seats` record and send notifications to the target audience.
  - `claim-hot-seat` (to be created): Will allow a client to claim the offer, updating the status and notifying the stylist.

### 3.5 Profile & Network Management

Corresponds to SRS Section 3.1.5.

- **Frontend Components**:
  - `ProfileForm.tsx`: A form for users to edit their public profile.
  - `ServiceManager.tsx`: A CRUD interface for professionals to manage their services.
  - `TrustedNetwork.tsx`: A UI for managing a user's trusted partners.
- **Data Models**:
  - `public.users`: Stores the user's profile information.
  - `public.services`: Stores the services offered by each professional.
  - `public.trusted_network`: Manages the many-to-many relationships between users and their trusted partners.
  - `public.auto_suggest_tracking`: Tracks interactions to power the auto-suggest feature.
- **Edge Functions**:
  - `upsert-profile`: Creates or updates a user's profile.
  - `send-trusted-invite`: Sends an email invitation to join a user's trusted network.
  - `complete-referral-tracking`: Increments the interaction count in `auto_suggest_tracking` after a successful collaboration.

### 3.6 AI Gateway & Intelligent Features

Corresponds to new AI-powered capabilities added in 2025.

- **Frontend Components**:
  - `AIConfiguration.tsx`: Admin interface for configuring AI providers and system prompts
  - AI Hooks: `useAIChat`, `useAIEmbedding`, `useAIStream` for consuming AI services
- **Data Models**:
  - `public.ai_usage_tracking`: Logs AI API calls for monitoring and cost tracking
  - `public.ai_configurations`: Stores provider settings and system prompts
- **AI Gateway (`src/lib/aiGateway.ts`)**:
  - Provider abstraction layer supporting Google Gemini, OpenAI GPT-5, Anthropic Claude 4.5, Ollama
  - Unified API for chat completions, embeddings, and streaming
  - Dynamic configuration with hot-reload capability
  - Error handling and retry logic
- **Use Cases**:
  - **Intelligent Matching**: Enhanced auto-match using LLM analysis of stylist specialties and client preferences
  - **Smart Recommendations**: Personalized service and product suggestions based on history
  - **Review Analysis**: Automated sentiment analysis and summary generation
  - **Content Generation**: Auto-generated bios and marketing content
  - **Natural Language Processing**: Chatbot for booking assistance

### 3.7 Service Catalog System

Corresponds to centralized service management added in 2025.

- **Frontend Components**:
  - `AdminServiceCatalog.tsx`: Admin interface for managing the global service catalog
  - `ServiceTaxonomySelector.tsx`: Hierarchical service selection interface
  - `EnhancedServiceSelector.tsx`: Improved service selection with taxonomy navigation
- **Data Models**:
  - `public.service_catalog`: Centralized repository of all platform services
    - Fields: `id`, `name`, `category`, `subcategory`, `description`, `base_price`, `duration`, `status`, `price_cents`, `duration_minutes`, `deposit_pct`
  - `public.service_taxonomy`: Hierarchical categorization structure
    - Categories (Hair, Nails, Skincare, etc.)
    - Subcategories (Color, Cuts, Extensions, etc.)
    - Service Types (Balayage, Full Highlights, etc.)
- **Library**: `src/lib/serviceTaxonomy.ts` - Taxonomy management utilities
- **Edge Functions**:
  - `manage-service-catalog`: CRUD operations for service catalog
  - `sync-user-services`: Sync individual stylist services with catalog
- **User Flow**:
  1.  Admin defines services in catalog with standardized taxonomy
  2.  Professionals select applicable services from catalog for their profile
  3.  Clients browse and select services using intuitive category navigation
  4.  Booking forms auto-populate pricing and duration from catalog

### 3.8 Referral Adjustment System

Corresponds to post-creation referral modifications added in 2025.

- **Frontend Components**:
  - `AdjustReferralModal.tsx`: Interface for modifying referral details
  - `EnhancedAdjustServiceModal.tsx`: Improved modal with real-time calculations
- **Data Models**:
  - `public.referral_adjustments`: Audit log of all referral modifications
    - Fields: `referral_id`, `adjustment_type`, `old_value`, `new_value`, `reason`, `approved_by`, `timestamp`
  - `public.referrals`: Extended with `adjustment_status` and `last_adjusted_at` fields
  - `public.service_adjustment_audit`: Immutable log for service adjustments
- **Library**: `src/lib/serviceAdjustmentCalculator.ts` - Adjustment calculation utilities
- **Edge Functions**:
  - `adjust-referral`: Processes referral modification requests
  - `auto-confirm-adjustments`: Automatically approves minor changes within thresholds
  - `calculate-adjustment-impact`: Computes fee and commission changes
- **User Flow**:
  1.  Pro or client requests service/price/duration adjustment
  2.  `AdjustReferralModal` displays current details and adjustment form
  3.  System validates adjustment against predefined rules
  4.  Minor adjustments auto-approved; major adjustments require manual approval
  5.  Fees and commissions recalculated in real-time
  6.  Adjustment logged in audit trail
  7.  Both parties notified of changes

### 3.9 Quick Rebook System

Corresponds to streamlined rebooking functionality added in 2025.

- **Frontend Components**:
  - `QuickRebook.tsx`: One-click rebooking interface
  - `BookDrawer.tsx`: Professional's booking management drawer
  - `EnhancedRebookForm.tsx`: Improved rebooking form with service catalog integration
- **Data Models**:
  - `public.booking_history`: Complete record of past appointments
  - `public.rebook_preferences`: User preferences for default rebooking settings
  - `public.referrals`: Extended with `rebooked_from` field linking to original appointment
- **Edge Functions**:
  - `quick-rebook`: Creates new referral/booking from previous appointment
  - `get-rebook-suggestions`: AI-powered recommendations based on patterns
  - `validate-rebook`: Ensures availability and service compatibility
- **User Flow**:
  1.  Client views booking history on dashboard
  2.  Clicks "Rebook" button on previous appointment
  3.  `QuickRebook` component opens with pre-filled information
  4.  AI suggests optimal times based on past patterns
  5.  Client adjusts services/time if needed
  6.  System validates availability
  7.  New booking created and professional notified via `BookDrawer`
  8.  Professional can accept, decline, or propose alternative time

## 4. Non-Functional Requirements Design

### 4.1 Performance (PERF-01)

- **Real-time Updates**: Supabase Realtime will be used to subscribe to changes in the `referrals` and `messages` tables, pushing updates to the client instantly.
- **Caching**: TanStack Query will be used to cache server-side data on the client, reducing redundant API calls.
- **Lazy Loading**: React's lazy loading capabilities will be used to code-split the application, so users only download the JavaScript needed for the current view.
- **Pagination**: All lists of data (e.g., referral history, open chair alerts) will be paginated on the backend to ensure fast initial load times.

### 4.2 Security (SEC-01, SEC-02)

- **Row Level Security (RLS)**: Supabase RLS policies will be implemented on all tables to ensure users can only access and modify data they own or are permitted to see.
- **JWT Authentication**: All communication with the Supabase backend will be authenticated using JSON Web Tokens (JWTs) managed by Supabase Auth.
- **Secure Edge Functions**: All Edge Functions will validate user authentication and authorization before executing any logic. Input will be sanitized to prevent injection attacks.

### 4.3 Usability (USAB-01)

- **Responsive Design**: The application will be built using a mobile-first approach with Tailwind CSS to ensure it is fully responsive and usable on all screen sizes.
- **Component Library**: A consistent look and feel will be maintained by using the `shadcn-ui` component library and a custom theme.