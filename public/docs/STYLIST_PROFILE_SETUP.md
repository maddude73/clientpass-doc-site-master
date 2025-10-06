# Stylist Profile Setup

This document provides a detailed description of the Stylist Profile Setup feature.

## 1. Overview

The Stylist Profile Setup page allows professional users to create and manage their comprehensive stylist profile. This profile is crucial for attracting clients, managing services, and configuring commission settings.

The page is implemented in the `StylistProfileSetupPage.tsx` page, which wraps the `StylistProfileSetup` component.

## 2. Key Features

### 2.1. Profile Photo Upload

-   Stylists can upload a professional photo to their profile.
-   The system provides a user-friendly interface for photo selection and preview.

### 2.2. Basic Information

-   Stylists can enter and update their basic personal and business information, including:
    -   Full Name
    -   Phone Number
    -   Business Location (e.g., salon name or address)
    -   City, State, and ZIP Code
    -   Professional Bio

### 2.3. Service & Pricing Manager

-   Integrated `ServiceManager` component for comprehensive service configuration:
    -   Add, edit, and delete services offered.
    -   Set custom pricing and duration for each service.
    -   Categorize services for better organization and client discoverability.

### 2.4. Commission Settings

-   Stylists can configure their default commission rates for various scenarios:
    -   **Referral Commission:** The percentage earned when sending a client to another stylist.
    -   **Coverage Commission:** The percentage earned when another stylist covers their clients.
    -   **Open Chair Commission (Host %):** The percentage earned as a host when renting out their chair.
-   These settings are managed via interactive sliders with defined ranges (e.g., 15-25%).

### 2.5. Portfolio & Gallery (Coming Soon)

-   A dedicated section for stylists to showcase their work through images.
-   This feature is planned for future development, allowing stylists to build a visual portfolio.

### 2.6. My Network

-   Integration with the `TrustedNetwork` component, allowing stylists to manage their professional network.
-   This enables collaboration and referral opportunities within a trusted circle.

### 2.7. Enable Suite Tools

-   For stylists who are also salon suite owners, there's an option to enable "Suite Tools".
-   Activating this feature updates their profile to `suite_owner` and unlocks specialized suite management functionalities.

## 3. Data Model

The Stylist Profile Setup feature interacts with the `users` table (for profile data and commission settings) and the `services` and `service_categories` tables (for service management) in the Supabase database.

## 4. User Interface

The Stylist Profile Setup page is organized into a tabbed interface for easy navigation:

-   **Basic Info:** For personal and business details.
-   **Services:** For managing services and commission settings.
-   **Portfolio:** For showcasing work (coming soon).
-   **My Network:** For managing trusted professional connections.
-   A sticky footer with a "Save Profile" button to persist changes.