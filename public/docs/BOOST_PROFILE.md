# Boost Profile

This document provides a detailed description of the Boost Profile feature.

## 1. Overview

The Boost Profile feature allows stylists to increase their visibility on the ClientPass platform, leading to more referrals and client bookings. It provides a mechanism for stylists to temporarily elevate their profile's prominence.

The page is implemented in the `BoostProfilePage.tsx` page, which wraps the `BoostProfile` component.

## 2. Key Features

### 2.1. Active Boost Status

-   **Real-time Status:** Displays whether a profile boost is currently active.
-   **Time Remaining:** Shows the remaining duration of an active boost (e.g., "23h 45m remaining").
-   **Boost Details:** Provides information about when the boost started and if a free boost credit was used.

### 2.2. Pro Member Benefits

-   **Free Boosts:** Pro members receive a certain number of free boosts per month (e.g., 4 free boosts).
-   **Reduced Rates:** Pro members also benefit from reduced rates for additional boosts beyond their free allocation.
-   **Tracking:** Displays the number of free boosts remaining for the current month.

### 2.3. Boost Benefits

-   **Priority Placement:** Boosted profiles appear at the top of search results and referral matching algorithms.
-   **Increased Visibility:** Profiles are highlighted with a special "boost" badge, attracting more attention.
-   **More Referrals:** Stylists can expect to receive significantly more referral opportunities during the boost period (e.g., up to 3x more).

### 2.4. Activate/Extend Boost

-   **Flexible Activation:** Stylists can activate a 24-hour boost for their profile.
-   **Extension Option:** If a boost is already active, stylists can extend its duration by another 24 hours.
-   **Payment/Free Credit:** The system intelligently determines if a free Pro member boost is available or if payment is required.
-   **Confirmation Dialog:** A confirmation dialog provides a summary of the boost benefits and cost before activation.

## 3. Data Model

The Boost Profile feature interacts with the following tables in the Supabase database:

-   `boosts`: Stores information about active and past boosts, including `boost_type`, `start_at`, `end_at`, `status`, and `pro_id`.
-   `users`: Stores user profile information, including `membership` status and `free_boosts_used_this_month`.

## 4. User Interface

The Boost Profile page features:

-   A header with a back button and a "Boost Profile" title.
-   Sections for displaying active boost status, Pro member benefits, and general boost benefits.
-   A prominent "Activate Boost" card with options to purchase or use free credits.
-   A confirmation dialog for boost activation.
