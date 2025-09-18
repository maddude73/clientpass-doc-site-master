# Frontend Overview

This document provides a high-level overview of the frontend architecture, structure, and key libraries used in the ClientPass application.

## 1. Core Technologies

- **Framework**: **React** (v18)
- **Build Tool**: **Vite**
- **Language**: **TypeScript**
- **Styling**: **Tailwind CSS** with a custom theme defined in `tailwind.config.ts` and `src/index.css`.
- **UI Components**: **shadcn-ui**, which is a collection of reusable components built on top of Radix UI and styled with Tailwind CSS. Custom components are located in `src/components`.
- **Icons**: **Lucide React**.

## 2. Project Structure

The main application code is located in the `src/` directory.

- **`src/main.tsx`**: The entry point of the application where the root React component is rendered.
- **`src/App.tsx`**: The root component that sets up routing, global context providers, and layout structure.
- **`src/pages/`**: Each file in this directory typically corresponds to a major route/page in the application (e.g., `HomePage.tsx`, `Dashboard.tsx`, `SettingsPage.tsx`).
- **`src/components/`**: Contains reusable UI components.
  - **`src/components/ui/`**: Auto-generated components from `shadcn-ui`.
  - **Feature-specific components**: Components are further organized into directories based on the feature they belong to, such as `auth/`, `referrals/`, `open-chair/`, and `coverage/`.
- **`src/stores/`**: Contains Zustand stores for global state management.
  - **`useAuthStore.ts`**: Manages the user's authentication state, session, and profile.
  - **`useReferralStore.ts`**: Manages state related to the referral creation and tracking process.
- **`src/hooks/`**: Contains custom React hooks, such as `use-toast.ts` for displaying notifications.
- **`src/integrations/`**: Handles connectivity with external services.
  - **`supabase/`**: Contains the Supabase client instance and generated TypeScript types for the database.
- **`src/lib/`**: Utility functions, such as `utils.ts` (for `cn` utility from `clsx` and `tailwind-merge`) and `commissionRules.ts`.

## 3. Routing

Client-side routing is managed by **React Router**. The main routes are defined in `src/App.tsx` and include:

- `/`: The main entry point, which directs to either the `AuthPage` or the user's primary dashboard.
- `/dashboard`: The main dashboard for `member` and `referrer` roles.
- `/pro-dashboard`: The dashboard for `pro` members, with advanced features.
- `/suite-dashboard`: The dashboard for `suiteOwner` roles, focused on suite management.
- `/profile-setup`: A dedicated page for stylists to complete their professional profile.
- `/open-chair-alerts`: The marketplace for viewing and accepting open chairs.
- `/affiliate-auth` & `/affiliate-dashboard`: The entry point and dashboard for the affiliate program.

## 4. State Management

The application uses a combination of **Zustand**, **TanStack Query**, and **React Context** for a layered state management approach.

- **Global Client State**: **Zustand** is the primary tool for managing global client-side state, such as UI state, form data, and the authentication status. Its simplicity and performance make it ideal for state that needs to be accessed across many components.
- **Server State**: **TanStack Query** is used to manage all server state. It handles fetching, caching, and synchronization of data with the Supabase backend, significantly simplifying data fetching and state synchronization logic.
- **Localized UI State**: **React Context** is used sparingly for localized state that needs to be shared within a specific subtree of the component hierarchy, but does not belong in the global state.

## 5. Styling and UI

- **Tailwind CSS**: A utility-first CSS framework is used for all styling.
- **Custom Theme**: A custom theme is defined in `tailwind.config.ts` and `src/index.css`, establishing a consistent design system with custom fonts (`Poppins`, `Nunito`) and a specific color palette (`--cp-teal`, `--cp-yellow`, etc.).
- **Component Library**: The project uses `shadcn-ui` for its base components (Button, Card, Dialog, etc.), which are then customized and extended for the application's specific needs.
