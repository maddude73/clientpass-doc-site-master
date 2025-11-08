# Architecture Overview

This document provides a high-level overview of the technical architecture for the ClientPass application, covering both the web and mobile frontends.

**Last Updated**: November 8, 2025

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
- **Capacitor**: Integrated for native functionality with **@capacitor/android**, **@capacitor/ios**, **@capacitor/core**, and **@capacitor/cli**.

### 1.3. Backend (Shared)

- **Platform**: A serverless architecture powered by **Supabase**.
  - **Database**: A **PostgreSQL** database.
  - **Authentication**: Supabase Auth for managing user accounts and sessions across both clients.
  - **Serverless Functions**: Business logic encapsulated in **Deno-based TypeScript functions** (Supabase Edge Functions).

### 1.4. AI Integration Layer

- **AI Gateway Pattern**: A centralized, provider-agnostic interface for AI services.
  - **Supported Providers**: Google Gemini, OpenAI GPT-5, Anthropic Claude 4.5, Ollama (local)
  - **Core Capabilities**:
    - Chat/completion APIs
    - Text embeddings for semantic search
    - Streaming responses for real-time interactions
  - **React Integration**: Custom hooks (`useAIChat`, `useAIEmbedding`, `useAIStream`)
  - **Configuration**: Dynamic provider selection with hot-reload capability

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

- **Database Schema**: Defined via SQL migration files in `supabase/migrations/`. It includes tables for `users`, `referrals`, `open_chairs`, `payments`, `service_catalog`, etc.
- **Edge Functions**: Located in `supabase/functions/`, each folder represents a serverless function that can be invoked from either the web or mobile client.
- **Authentication**: Supabase Auth provides a unified authentication system for both applications.

### 3.1. Service Catalog System

A centralized platform for managing and standardizing service offerings across all professionals.

- **AdminServiceCatalog**: Admin interface for managing the global service catalog
- **Service Taxonomy**: Hierarchical categorization (Categories → Subcategories → Service Types)
- **Components**:
  - `ServiceTaxonomySelector`: Hierarchical service selection interface
  - `EnhancedServiceSelector`: Improved UX with taxonomy-based navigation
- **Data Model**: `service_catalog` table with standardized service definitions, including fields for `description`, `price_cents`, `duration_minutes`, and `deposit_pct`.

### 3.2. AI-Powered Features

AI integration enhances multiple platform capabilities:

- **Intelligent Matching**: LLM-powered stylist-client matching based on specialty, history, and preferences
- **Smart Recommendations**: Personalized service and product suggestions
- **Review Analysis**: Automated sentiment analysis and summary generation
- **Content Generation**: Automated bio creation and marketing content for affiliates
- **Natural Language Booking**: Chatbot interface for scheduling and inquiries

### 3.3. Enhanced Referral System

Extended referral capabilities beyond the core workflow:

- **Post-Creation Adjustments**: Modify services, pricing, and duration after referral creation
- **Auto-Confirmation**: Automated approval for minor adjustments within predefined thresholds
- **Validation & Calculation**: Real-time recalculation of fees and commissions
- **Audit Trail**: Complete history of all modifications for transparency, stored in `service_adjustment_audit` table
- **Components**:
  - `AdjustReferralModal`: Interface for modifying referral details
  - `EnhancedAdjustServiceModal`: Improved UX with real-time calculations

### 3.4. Quick Rebook System

Streamlined rebooking experience for repeat appointments:

- **One-Click Rebooking**: Pre-filled information from previous appointments
- **Smart Suggestions**: AI-powered recommendations based on booking patterns
- **Service History**: Complete view of past appointments
- **Components**:
  - `QuickRebook`: Rapid rebooking interface
  - `BookDrawer`: Professional's booking management interface
  - `EnhancedRebookForm`: Improved rebooking form with catalog integration

## 4. Data Flow

The data flow is consistent for both the web and mobile applications.

1.  **User Interaction**: A user performs an action in the React (web) or React Native (mobile) frontend.
2.  **Client-Side Logic**: The frontend component calls a function that uses the Supabase client (`@supabase/supabase-js`).
3.  **Backend Invocation**:
    - For simple data retrieval, the client queries the Supabase database directly (respecting RLS policies).
    - For complex business logic, the client invokes a Supabase Edge Function.
    - For AI operations, the client uses the AI Gateway which abstracts provider-specific implementations.
4.  **Edge Function Execution**: The serverless function runs, interacting with the database.
5.  **Response**: The function returns a response to the client.
6.  **UI Update**: The frontend uses the response to update its state and re-render the UI.

### 4.1. AI-Enhanced Data Flow

For AI-powered features, an additional layer is introduced:

1.  **User Interaction**: User initiates an AI-powered action (e.g., smart matching, content generation)
2.  **AI Gateway Invocation**: Frontend calls AI Gateway hooks (`useAIChat`, `useAIEmbedding`)
3.  **Provider Selection**: AI Gateway routes request to configured provider (Google, OpenAI, Anthropic, Ollama)
4.  **AI Processing**: Provider processes request and returns results
5.  **Result Integration**: Response is integrated into application logic (e.g., match scoring, content display)
6.  **UI Update**: Enhanced results displayed to user

## 5. Third-Party Integrations

### 5.1. Payment Processing

- **Stripe**: Handles all payment processing and payouts
- **Stripe Connect**: Enables direct payouts to professionals

### 5.2. AI Service Providers

- **Google Gemini**: Primary AI provider for embeddings and chat
- **OpenAI GPT-5**: Advanced language model for complex tasks
- **Anthropic Claude 4.5**: Alternative LLM with strong reasoning capabilities
- **Ollama**: Optional local model deployment for privacy-sensitive operations

### 5.3. Infrastructure

- **Vercel**: Frontend hosting and serverless API functions
- **Supabase**: Backend-as-a-Service (database, auth, edge functions)
- **MongoDB Atlas**: Document storage for RAG (Retrieval-Augmented Generation) documentation system

## 6. Security Architecture

### 6.1. Authentication & Authorization

- **Supabase Auth**: JWT-based authentication
- **Row Level Security (RLS)**: Database-level access control
- **Role-Based Access Control (RBAC)**: User roles define permissions

### 6.2. API Security

- **API Key Management**: Secure storage of AI provider keys
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Sanitization of user inputs before AI processing

### 6.3. Data Privacy

- **Encryption**: All data encrypted at rest and in transit
- **PII Protection**: Personal information handling complies with privacy regulations
- **AI Data Handling**: User data sent to AI providers is minimized and anonymized where possible