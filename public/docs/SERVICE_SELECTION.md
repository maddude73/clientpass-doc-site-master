# Service Selection

This document provides a detailed description of the Service Selection feature, which allows stylists to manage the services they offer.

## 1. Overview

The Service Selection feature provides stylists with a comprehensive tool to define, categorize, and price their professional services. This ensures that clients can accurately view and book the specific services offered by each stylist.

The feature is primarily implemented within the `ServiceManager.tsx` component, which is integrated into pages like `StylistProfileSetup.tsx`.

## 2. Features

### 2.1. Service Management

-   **Add New Service:** Stylists can add new services to their profile by providing:
    -   **Name:** A descriptive name for the service (e.g., "Women's Haircut", "Full Balayage").
    -   **Description:** An optional detailed description of the service.
    -   **Price:** The price of the service.
    -   **Duration:** The estimated duration of the service in minutes.
    -   **Category:** The service can be assigned to a predefined category (e.g., "Haircuts", "Coloring").
-   **Edit Existing Service:** Stylists can modify the details of any existing service.
-   **Delete Service:** Stylists can remove services they no longer offer.

### 2.2. Service Categorization

-   Services can be organized into categories, making it easier for clients to browse and find what they need.
-   The categories are fetched from the `service_categories` table in the Supabase database.

### 2.3. Price and Duration Configuration

-   Stylists have full control over the pricing and estimated duration for each service, allowing for flexible business models.

## 3. Data Model

The Service Selection feature interacts with the following tables in the Supabase database:

-   `services`: This table stores the details of each service offered by a stylist, including `name`, `description`, `price`, `duration_minutes`, and `category_id`.
-   `service_categories`: This table stores the predefined categories for services.

## 4. User Interface

The user interface for service selection typically includes:

-   A form for adding or editing service details.
-   A list or grid displaying all currently offered services, with options to edit or delete each one.
-   Dropdowns or selectors for choosing service categories.