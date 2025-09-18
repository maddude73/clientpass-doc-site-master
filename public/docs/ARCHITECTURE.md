# Architecture Overview

This document provides a high-level overview of the technical architecture for the ClientPass application.

## 1. Core Technology Stack

- **Frontend**: A modern Single-Page Application (SPA) built with **React** and **Vite**.
  - **Language**: **TypeScript**
  - **UI Components**: **shadcn-ui** on top of Radix UI and Tailwind CSS.
  - **Routing**: **React Router** for client-side navigation.
  - **State Management**: **Zustand** for lightweight global client state, **TanStack Query** for server state management (caching, refetching), and React Context for localized UI state.

- **Backend**: A serverless architecture powered by **Supabase**.
  - **Database**: A **PostgreSQL** database managed by Supabase.
  - **Authentication**: Supabase Auth for managing user accounts and sessions.
  - **Serverless Functions**: Business logic is encapsulated in **Deno-based TypeScript functions** deployed as Supabase Edge Functions. These handle tasks like sending referrals, processing payments, and managing user states.

## 2. Frontend Architecture

The frontend is located in the `src/` directory and follows a standard component-based structure.

- **`src/pages/`**: Contains the top-level components for each route in the application (e.g., `HomePage.tsx`, `Dashboard.tsx`, `AdminPage.tsx`).
- **`src/components/`**: Contains reusable React components used across different pages. These are further organized by feature (e.g., `auth`, `referrals`, `open-chair`, `admin`).
- **`src/components/auth/RoleGuard.tsx`**: A critical component that protects routes based on user roles (e.g., ensuring only users with the 'admin' role can access the `/admin` page).
- **`src/contexts/`**: Holds React Context providers, such as `AuthContext.tsx`, which manages user session and profile data globally.
- **`src/integrations/`**: Contains the Supabase client configuration, which is the primary interface to the backend.
- **`src/App.tsx`**: The main application component that sets up routing, context providers, and global components like toasters.

## 3. Backend Architecture

The backend is entirely managed through Supabase, abstracting away the need for a traditional server.

- **Database Schema**: The schema is defined via SQL migration files in `supabase/migrations/`. It includes tables for `users`, `referrals`, `open_chairs`, `payments`, `affiliates`, `admin_audit_log`, `feature_flags`, `platform_settings`, and more, modeling the core business domains.
- **Edge Functions**: Located in `supabase/functions/`, each folder represents a serverless function that can be invoked from the client. This is where most of the core business logic resides. For example:
  - `send-referral`: Handles the logic for matching and notifying stylists.
  - `accept-open-chair`: Manages the process of a stylist claiming an open chair.
  - `settle-open-chair-commission`: Calculates and records commission splits after a session.
- **Authentication**: User and session management is handled by Supabase Auth, which integrates directly with the database via the `auth.users` table and RLS (Row Level Security) policies.

## 4. Data Flow

1.  **User Interaction**: A user performs an action in the React frontend (e.g., fills out a referral form).
2.  **Client-Side Logic**: The frontend component calls a function that uses the Supabase client (`@supabase/supabase-js`).
3.  **Backend Invocation**:
    - For simple data retrieval, the client queries the Supabase database directly (respecting RLS policies).
    - For complex business logic, the client invokes a Supabase Edge Function.
4.  **Edge Function Execution**: The serverless function runs, often interacting with the Supabase database using the service role key to perform privileged operations.
5.  **Response**: The Edge Function returns a response to the client.
6.  **UI Update**: The frontend uses the response to update its state (often via TanStack Query) and re-render the UI.
