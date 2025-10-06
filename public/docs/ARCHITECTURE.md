---
id: 68dccbb7479feecff6266a72
revision: 10
---

# Architecture Overview

This document provides a high-level overview of the technical architecture for the ClientPass application, covering both the web and mobile frontends.

## 1. Core Technology Stack

### 1.1. Web Application

- **Frontend**: A modern Single-Page Application (SPA) built with **React** and **Vite**.
  - **Language**: **TypeScript**
  - **UI Components**: **shadcn-ui** on top of Radix UI and Tailwind CSS.
  - **Routing**: **React Router** for client-side navigation.
  - **State Management**: **Zustand** for lightweight global client state, **TanStack Query** for server state management.

### 1.2. Mobile Application

- **Framework**: **React Native** with **Expo**.
- **Language**: **TypeScript**.
- **UI Components**: **React Native Paper** for Material Design components.
- **Routing**: **Expo Router** for file-system based routing.
- **State Management**: **React Context** for global authentication state.

### 1.3. Backend (Shared)

- **Platform**: A serverless architecture powered by **Supabase**.
  - **Database**: A **PostgreSQL** database.
  - **Authentication**: Supabase Auth for managing user accounts and sessions across both clients.
  - **Serverless Functions**: Business logic encapsulated in **Deno-based TypeScript functions** (Supabase Edge Functions).

## 2. Frontend Architecture

### 2.1. Web App (`style-referral-ring`)

The web frontend is located in the `src/` directory and follows a standard component-based structure.

- **`src/pages/`**: Top-level components for each route.
- **`src/components/`**: Reusable React components, organized by feature.
- **`src/App.tsx`**: The main application component that sets up routing and global providers.

### 2.2. Mobile App (`clientpass-react-native`)

The mobile frontend is built with Expo and uses a file-system based routing approach.

- **`app/`**: The main directory for all routes and screens.
  - **`app/(tabs)/`**: Defines the primary tab bar navigation for authenticated users.
  - **`app/(auth)/`**: Defines the authentication stack (login, signup).
  - **`app/_layout.tsx`**: The root layout component that wraps the entire application and manages the navigation state.
- **`components/`**: Contains reusable React Native components.
  - **`components/dashboards/`**: High-level dashboard components for each user role.
- **`contexts/`**: Holds global React Context providers, like `AuthContext`.

## 3. Backend Architecture

The backend is entirely managed through Supabase, serving both the web and mobile clients.

- **Database Schema**: Defined via SQL migration files in `supabase/migrations/`. It includes tables for `users`, `referrals`, `open_chairs`, `payments`, etc.
- **Edge Functions**: Located in `supabase/functions/`, each folder represents a serverless function that can be invoked from either the web or mobile client.
- **Authentication**: Supabase Auth provides a unified authentication system for both applications.

## 4. Data Flow

The data flow is consistent for both the web and mobile applications.

1.  **User Interaction**: A user performs an action in the React (web) or React Native (mobile) frontend.
2.  **Client-Side Logic**: The frontend component calls a function that uses the Supabase client (`@supabase/supabase-js`).
3.  **Backend Invocation**:
    - For simple data retrieval, the client queries the Supabase database directly (respecting RLS policies).
    - For complex business logic, the client invokes a Supabase Edge Function.
4.  **Edge Function Execution**: The serverless function runs, interacting with the database.
5.  **Response**: The function returns a response to the client.
6.  **UI Update**: The frontend uses the response to update its state and re-render the UI.