```markdown
---
title: Frontend Overview
revision: 2.1
last_updated: November 8, 2025
---

This document provides a high-level overview of the frontend architecture, structure, and key libraries used in the ClientPass application. It now covers both the web and the React Native mobile application.

## 1. Web Application (`style-referral-ring`)

### 1.1. Core Technologies

- **Framework**: **React** (v18)
- **Build Tool**: **Vite**
- **Language**: **TypeScript**
- **Styling**: **Tailwind CSS** with a custom theme.
- **UI Components**: **shadcn-ui**
- **Icons**: **Lucide React**.
- **Routing**: **React Router**
- **State Management**: **Zustand**, **TanStack Query**, and **React Context**.

### 1.2. Recent Updates

- **Service Management**: Enhanced service management with `ServiceTaxonomySelector` and `EnhancedServiceSelector` for better categorization and selection of services.
- **UI Updates**: Consistent UI updates across pages to match new design mockups.
- **Functional Enhancements**: Added `QuickRebook` feature for faster service rebooking post-completion.
- **Referrals**: New `AdjustReferralModal` for managing referral-based bookings with audit trails.
- **Coverage Mode**: Added navigation fixes and a `Coverage Mode` card for improved user experience.
- **Service Catalog**: Introduced `AdminServiceCatalog` for managing service categories and services.

## 2. Mobile Application (`clientpass-react-native`)

### 2.1. Core Technologies

- **Framework**: **React Native** with **Expo**
- **Language**: **TypeScript**
- **UI Components**: **React Native Paper** for Material Design components.
- **Styling**: React Native **StyleSheet** with a custom theme.
- **Icons**: **lucide-react-native** and **@expo/vector-icons**.
- **Routing**: **Expo Router** (file-system based).
- **State Management**: **React Context** (`AuthContext`) for global state.

### 2.2. Project Structure

The main application code is located in the root directory.

- **`app/`**: Contains all routes and screens, managed by Expo Router.
  - **`app/(tabs)/`**: Defines the main tab bar navigation for authenticated users.
    - **`_layout.tsx`**: The layout component for the tab bar.
    - **`index.tsx`**: The main home screen, which acts as a role-based router to different dashboards.
  - **`app/(auth)/`**: Screens for the authentication flow (Login, Sign Up).
  - **`_layout.tsx`**: The root layout of the entire application, wrapping all routes.
- **`components/`**: Contains reusable React Native components.
  - **`components/dashboards/`**: Home screen components for different user roles (Pro, Client, etc.).
  - **`components/ui/`**: Custom UI components like `CustomSegmentedControl`.
- **`contexts/`**: Contains global state management providers.
  - **`AuthContext.tsx`**: Manages user authentication state, session, and profile data.
- **`lib/`**: Utility functions, such as the Supabase client configuration.

### 2.3. Routing

Routing is managed by **Expo Router**, which uses a file-based system.

- **`app/_layout.tsx`**: The root layout. It checks for authentication status and redirects users to either the auth flow or the main app.
- **`app/(auth)` group**: Defines the screens for the authentication stack (login, signup).
- **`app/(tabs)` group**: Defines the main tab bar navigation for authenticated users. The tabs include Home, Schedule, Earnings, Pro Hub, and Inbox.

### 2.4. State Management

- **Global State**: User authentication and profile data are managed globally via `AuthContext`. This makes user data accessible throughout the component tree.
- **Local/Component State**: Standard React `useState` and `useEffect` hooks are used for managing local component state.

### 2.5. Recent Updates

- **Service Management**: Introduced `ServiceTaxonomySelector` for improved service categorization and selection.
- **UI Enhancements**: Updated UI components to align with the latest design standards.
- **Functional Enhancements**: Implemented `QuickRebook` feature for seamless rebooking of services.
- **Referrals**: Added `AdjustReferralModal` for managing and auditing referral-based bookings.
```