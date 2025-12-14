---
id: 693f2168fd5352c98a77a105
revision: 1
---
# Affiliate Dashboard

This document provides a detailed description of the Affiliate Dashboard, a dedicated portal for affiliate partners to track their performance, manage their network, and access marketing materials.

## 1. Overview

The Affiliate Dashboard serves as the central hub for affiliate partners. It provides a comprehensive set of tools and information to help affiliates succeed in promoting ClientPass and its associated products. The dashboard's content dynamically adapts based on the affiliate's account status.

The dashboard is implemented in the `AffiliateDashboard.tsx` component.

## 2. Key Features and Account Statuses

The Affiliate Dashboard handles different account statuses, providing appropriate views and functionalities for each.

### 2.1. Pending Approval Status

-   **Display:** If an affiliate's account is `pending` approval, the dashboard displays a clear message indicating that the account is under review.
-   **Notification:** Affiliates are informed that they will receive an email notification once their account is approved.
-   **Action:** The only available action is to sign out.

### 2.2. Suspended Status

-   **Display:** If an affiliate's account is `suspended`, the dashboard displays a message indicating the suspension.
-   **Action:** Affiliates are advised to contact support for assistance, and the only available action is to sign out.

### 2.3. Active Dashboard (Approved Affiliates)

Once an affiliate account is approved and active, the dashboard provides full functionality:

-   **Welcome Message:** A personalized welcome message for the active affiliate.
-   **Sign Out:** Option to sign out from the affiliate account.
-   **Integrated Marketplace:** The core of the active dashboard is the integration of the `AffiliateMarketplace` component. This provides access to:
    -   **Product Listings:** A curated list of products available for promotion.
    -   **Referral Link Generation:** Tools to generate unique referral links for products.
    -   **Performance Tracking:** Summary of key metrics, including clicks, signups, bookings, and earnings (though detailed tracking might be within the marketplace component itself).

## 3. Data Model

The Affiliate Dashboard interacts with the `users` table (for affiliate status and profile information) and potentially other tables related to affiliate performance and marketplace products in the Supabase database.

## 4. User Interface

The Affiliate Dashboard features a responsive user interface that adapts to different account statuses:

-   **Header:** For active affiliates, the header displays a welcome message and a sign-out button.
-   **Main Content Area:** Dynamically displays content based on the affiliate's status. For active affiliates, this includes the `AffiliateMarketplace` component.