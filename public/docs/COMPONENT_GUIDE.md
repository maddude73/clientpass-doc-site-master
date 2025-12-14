---
id: 693f21683e4d947b0f8c7dcc
revision: 1
---
---
title: Frontend Component Guide
revision: 2.2
last_updated: November 8, 2025
---

## 1. Introduction

This document provides an overview of the component libraries used in the ClientPass application, covering both the web and mobile frontends.

---

## 2. Web Application (`style-referral-ring`)

### 2.1. Component Philosophy

- **Foundation**: The UI is built upon **shadcn-ui**, which provides unstyled, accessible base components (primitives).
- **Styling**: All components are styled using **Tailwind CSS** utility classes.
- **Composition**: Complex components are built by composing simpler ones.

### 2.2. Component Directory Structure

- **`src/components/ui/`**: Contains the base UI primitives from `shadcn-ui` (e.g., `Button`, `Card`, `Input`).
- **`src/components/{feature}/`**: Contains custom components, specific to a particular feature domain (e.g., `src/components/referrals/`).

### 2.3. Key Feature Components

(This section describes the web app's components which are used as a reference for the mobile app)

- **Authentication (`/auth`)**: `LoginForm`, `SignUpForm`, `RoleGuard`.
- **Administration (`/admin`)**: `MasterAdminConsole` and its various modules, including the new `AdminServiceCatalog`.
- **Referrals (`/referrals`)**: `EnhancedReferralForm`, `CountdownTimer`, `ReferralTimerDashboard`, `AdjustReferralModal`.
- **Open Chair (`/open-chair`)**: `PostOpenChairForm`, `LiveSessionCard`.
- **Coverage Mode (`/coverage`)**: `CoverageModePage`, `VacationReferralForm`.
- **Boost (`/boost`)**: `BoostStatusCard`.
- **Booking (`/booking`)**: `QuickRebook`, `RebookForm`.
- **Client (`/client`)**: `ClientBookingFlow`, `ClientReferralSection`, `ServiceSelection`, `ShareAndEarn`.
- **Service Management (`/services`)**: `ServiceManager`, `ServiceTaxonomySelector`, `EnhancedServiceSelector`.
- **Auto-Match (`/auto-match`)**: `AutoMatchSystem`.
- **And more...**

---

## 3. React Native Mobile App (`clientpass-react-native`)

### 3.1. Component Philosophy

- **Foundation**: The UI is built using **React Native Paper**, a component library that implements Google's Material Design.
- **Styling**: All components are styled using React Native's core **StyleSheet** API. A global theme is defined in `app/_layout.tsx` to ensure consistency.
- **Icons**: Icons are primarily from the **lucide-react-native** library to maintain visual consistency with the web application.

### 3.2. Component Directory Structure

- **`app/(tabs)/`**: These files define the primary screens accessible from the main tab bar (e.g., `index.tsx` for Home, `schedule.tsx`, `earnings.tsx`).
- **`components/`**: Contains reusable React Native components.
  - **`components/dashboards/`**: Contains the top-level dashboard components for each user role (`ProDashboard`, `ClientDashboard`, etc.).
    - **`components/dashboards/client/`**: Contains the sub-components that make up the tabbed `ClientDashboard`.
  - **`components/ui/`**: Contains custom, reusable UI elements like `CustomSegmentedControl`.
  - **Feature-specific components**: Other components are organized by feature (e.g., `boost/`, `client/`, `dashboard/`).

### 3.3. Base UI Components (`react-native-paper`)

These are the foundational components from React Native Paper.

- `Button`: For all clickable actions.
- `Card`, `Card.Content`, `Card.Title`: The primary container for grouping related content.
- `TextInput`: For all text input fields.
- `List.Item`, `List.Section`: For creating structured lists.
- `Avatar.Icon`, `Avatar.Image`: For displaying user avatars.
- `Badge`: For status indicators.
- `Switch`: For boolean toggles.
- `SegmentedButtons`: For tab-like controls.

### 3.4. Key Feature Components

This section highlights some of the most important custom components built for the mobile app.

#### Dashboards (`/components/dashboards/`)
- **`RoleBasedHomeScreen` (`app/(tabs)/index.tsx`)**: A top-level router component that renders the correct dashboard based on the authenticated user's role.
- **`ProDashboard.tsx`**: The main dashboard for professional users. It includes `EarningsCard`, `BoostStatusCard`, and a series of `ActionCard`s for key workflows like posting open chairs and sending referrals.
- **`ClientDashboard.tsx`**: A self-contained, tabbed dashboard for clients. It includes sub-components for a home overview, booking, payments, schedule, and more.
- **`SuiteDashboard.tsx`**: A dashboard for salon suite owners to monitor in-suite activity.
- **`AdminDashboard.tsx` & `AffiliateDashboard.tsx`**: Dashboards for admin and affiliate users.

#### Core UI (`/components/`)
- **`ActionCard.tsx`**: A reusable card component for displaying a primary action with an icon, title, description, and navigation link.
- **`ClientPassLogo.tsx`**: Displays the application's logo.
- **`CustomSegmentedControl.tsx`**: A custom-styled tab selector that mimics the visual style of the web application's tabs.

#### Feature Screens (`/app/(tabs)/`)
- **`earnings.tsx`**: A screen for professionals to track their pending, completed, and total earnings over different time periods.
- **`pro-hub.tsx`**: A screen that displays featured partner deals and upcoming features for professionals.
- **`inbox.tsx`**: A screen for users to view notifications, with a focus on actionable referral requests that include countdown timers.

---