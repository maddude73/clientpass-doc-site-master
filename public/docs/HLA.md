---
id: 68dccbb7479feecff6266a84
revision: 15
---

# High Level Architecture

**Last Updated**: November 8, 2025

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

- **AI Integration**: A centralized AI Gateway providing provider-agnostic AI services.
  - **Providers**: Google Gemini, OpenAI GPT-5, Anthropic Claude 4.5, Ollama
  - **Capabilities**: Chat/completion, embeddings, streaming responses
  - **Vector Storage**: pgvector extension for semantic search and similarity matching

## 2. Frontend Architecture

The frontend is located in the `src/` directory and follows a standard component-based structure.

- **`src/pages/`**: Contains the top-level components for each route in the application (e.g., `HomePage.tsx`, `Dashboard.tsx`).
- **`src/components/`**: Contains reusable React components used across different pages. These are further organized by feature (e.g., `auth`, `referrals`, `open-chair`).
- **`src/stores/`**: Contains Zustand stores for global state management (e.g., `useAuthStore.ts`).
- **`src/integrations/`**: Contains the Supabase client configuration, which is the primary interface to the backend.
- **`src/App.tsx`**: The main application component that sets up routing, context providers, and global components like toasters.

## 3. Backend Architecture

The backend is entirely managed through Supabase, abstracting away the need for a traditional server.

- **Database Schema**: The schema is defined via SQL migration files in `supabase/migrations/`. It includes tables for `users`, `referrals`, `open_chairs`, `payments`, `affiliates`, and more, modeling the core business domains.
- **Edge Functions**: Located in `supabase/functions/`, each folder represents a serverless function that can be invoked from the client. This is where most of the core business logic resides. For example:
  - `send-referral`: Handles the logic for matching and notifying stylists.
  - `accept-open-chair`: Manages the process of a stylist claiming an open chair.
  - `settle-open-chair-commission`: Calculates and records commission splits after a session.
  - `adjust-referral`: Processes post-creation referral modifications.
  - `auto-confirm-adjustments`: Automated approval for minor adjustments.
  - `quick-rebook`: Creates new bookings from previous appointments.
  - `manage-service-catalog`: CRUD operations for the service catalog.
- **Authentication**: User and session management is handled by Supabase Auth, which integrates directly with the database via the `auth.users` table and RLS (Row Level Security) policies.
- **AI Gateway**: Centralized service layer (`src/lib/aiGateway.ts`) that abstracts AI provider implementations and provides React hooks for easy integration.

## 4. Data Flow

1.  **User Interaction**: A user performs an action in the React frontend (e.g., fills out a referral form).
2.  **Client-Side Logic**: The frontend component calls a function that uses the Supabase client (`@supabase/supabase-js`).
3.  **Backend Invocation**:
    - For simple data retrieval, the client queries the Supabase database directly (respecting RLS policies).
    - For complex business logic, the client invokes a Supabase Edge Function.
    - For AI operations, the client uses the AI Gateway which routes to the configured provider.
4.  **Edge Function Execution**: The serverless function runs, often interacting with the Supabase database using the service role key to perform privileged operations.
5.  **Response**: The Edge Function returns a response to the client.
6.  **UI Update**: The frontend uses the response to update its state (often via TanStack Query) and re-render the UI.

### 4.1 AI-Enhanced Data Flow

For AI-powered features:

1.  **User Interaction**: User initiates an AI-powered action (smart matching, content generation, etc.)
2.  **AI Gateway Invocation**: Frontend calls AI hooks (`useAIChat`, `useAIEmbedding`, `useAIStream`)
3.  **Provider Selection**: AI Gateway routes to configured provider (Google, OpenAI, Anthropic, Ollama)
4.  **AI Processing**: Provider processes request and returns results
5.  **Result Integration**: Response integrated into application logic
6.  **Logging**: All AI operations logged to `ai_usage_tracking` for monitoring and cost analysis

## 5. Key System Components

### 5.1 Core Features

- User Authentication & Onboarding
- Referral Management
- Open Chair Marketplace
- Hot Seat Flash Sales
- Coverage Mode
- Profile & Network Management
- Admin Console

### 5.2 Enhanced Features (2025)

- **AI Gateway**: Multi-provider AI integration with intelligent matching and recommendations
- **Service Catalog**: Centralized, taxonomy-based service management
- **Referral Adjustments**: Post-creation modifications with auto-approval
- **Quick Rebook**: One-click rebooking with AI suggestions

### 5.3 Infrastructure

- **Supabase**: Backend platform (database, auth, edge functions)
- **Vercel**: Frontend hosting and serverless API functions
- **MongoDB Atlas**: RAG documentation system storage
- **Stripe**: Payment processing and payouts
- **AI Providers**: Google, OpenAI, Anthropic, Ollama
