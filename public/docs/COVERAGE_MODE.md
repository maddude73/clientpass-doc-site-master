---
id: 693f2168beac600bbda866ff
revision: 1
---
# Coverage Mode

This document provides a detailed description of the Coverage Mode feature.

## 1. Overview

The Coverage Mode feature allows stylists to temporarily make themselves unavailable while ensuring their clients can still receive services from trusted colleagues. When a stylist activates Coverage Mode, other stylists within their trusted network can step in to cover their clients' needs. This feature is crucial for maintaining client satisfaction and business continuity during a stylist's absence.

The page is implemented in the `CoverageMode.tsx` page, which wraps the `CoverageModePage.tsx` component.

## 2. Key Features

### 2.1. Activation and Deactivation

-   **Toggle Switch:** Stylists can easily activate or deactivate Coverage Mode using a prominent toggle switch on the page.
-   **Status Display:** The current status of Coverage Mode (e.g., "Active", "Inactive") is clearly displayed.

### 2.2. Duration Setting

-   **Flexible Duration:** Stylists can set a specific duration for their Coverage Mode (e.g., 1 day, 1 week, custom date range).
-   **Automatic Deactivation:** The system automatically deactivates Coverage Mode once the set duration expires.

### 2.3. Trusted Network Integration

-   When Coverage Mode is active, the stylist's clients can be referred to other stylists within their pre-defined trusted network.
-   This ensures that clients are covered by professionals who meet the stylist's standards and preferences.

### 2.4. Client Communication

-   The system can automatically inform clients that their primary stylist is in Coverage Mode and suggest alternative stylists from the trusted network. (This is an implied feature based on the concept).

## 3. Data Model

The Coverage Mode feature interacts with the `users` table in the Supabase database. The `coverage_mode` field in the `users` table is updated to reflect the stylist's availability status. Additional fields might include `coverage_start_date` and `coverage_end_date`.

## 4. User Interface

The user interface for Coverage Mode typically includes:

-   A header with a back button and a "Coverage Mode" title.
-   A toggle switch for activation/deactivation.
-   Options for setting the duration of the coverage.
-   A clear display of the current Coverage Mode status.