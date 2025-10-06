---
id: 68dccbb8479feecff6266a90
revision: 10
---

# Software Architecture Document (SAD)

## 1. Introduction

### 1.1 Purpose
This document provides a comprehensive architectural overview of the ClientPass application. It is intended for developers, architects, and technical stakeholders to understand the system's structure, components, interactions, and design principles.

### 1.2 Scope
The scope of this document covers the **ClientPass platform**, which includes a frontend web application, a native mobile application, a serverless backend, the database schema, and the deployment strategy.

### 1.3 Architectural Representation
This document uses a simplified version of the **4+1 architectural view model** to describe the system from different perspectives:
- **Logical View**: The system's functional components and their responsibilities.
- **Process View**: The system's dynamic behavior and component interactions.
- **Development View**: The organization of the source code and build system.
- **Physical (Deployment) View**: The mapping of software components to the physical infrastructure.
- **Data View**: The structure and organization of the data.

## 2. System Architecture Diagram

This diagram provides a detailed, high-level view of the entire system architecture, including network boundaries, services, and dependencies for both web and mobile clients.

```mermaid
graph TB
    subgraph "User's Devices"
        direction LR
        UserWeb["🧍<br/>User (Web)"]
        UserMobile["📱<br/>User (Mobile)"]
    end

    subgraph "Client Frontends"
        direction TB
        subgraph "Vercel CDN"
            FrontendWeb[React SPA]
        end
        subgraph "App Stores"
            FrontendMobile[React Native App]
        end
    end

    UserWeb -- "HTTPS" --> FrontendWeb
    UserMobile -- "App Install" --> FrontendMobile

    subgraph "Supabase Platform (Cloud Provider)"
        direction TB
        Gateway[API Gateway / Firewall]

        subgraph "Backend Services"
            direction LR
            Auth[Auth Service]
            PostgREST[PostgREST API]
            Realtime[Realtime Service]
            EdgeFunctions[Edge Functions]
        end

        Database[(PostgreSQL DB)]

        Gateway --> Auth
        Gateway --> PostgREST
        Gateway -- "WSS" --> Realtime
        Gateway --> EdgeFunctions

        Auth --> Database
        PostgREST --> Database
        Realtime --> Database
        EdgeFunctions --> Database
    end

    FrontendWeb -- "HTTPS/WSS" --> Gateway
    FrontendMobile -- "HTTPS/WSS" --> Gateway

    subgraph "Third-Party APIs"
        direction TB
        Stripe[Stripe API]
        Resend[Resend API]
    end

    EdgeFunctions -- "HTTPS" --> Stripe
    EdgeFunctions -- "HTTPS" --> Resend

    style FrontendWeb fill:#61DAFB,color:#000
    style FrontendMobile fill:#61DAFB,color:#000
    style Gateway fill:#F48024,color:#fff
    style Database fill:#336791,color:#fff
    style Stripe fill:#6772e5,color:#fff
```

## 3. Logical View

This diagram illustrates the high-level logical components of the system and their primary relationships.

```mermaid
graph TD
    subgraph "Client Devices"
        A[Web Frontend (React)]
        B[Mobile Frontend (React Native)]
    end

    subgraph "Supabase Cloud"
        C[Authentication]
        D[Database - PostgreSQL]
        E[Edge Functions - Deno]
        F[Real-time Service]
    end

    subgraph "Third-Party Services"
        G[Stripe API]
        H[Resend API]
    end

    A -- "API Calls" --> C
    A -- "API Calls" --> D
    A -- "API Calls" --> E
    A -- "API Calls" --> F
    B -- "API Calls" --> C
    B -- "API Calls" --> D
    B -- "API Calls" --> E
    B -- "API Calls" --> F

    E -- "DB Connection" --> D
    E -- "HTTPS API Call" --> G
    E -- "HTTPS API Call" --> H
```

The system is decomposed into three main containers: the Web Frontend, the Mobile Frontend, and the shared Backend Services.

### 3.1 Frontend Applications (Client-Side)

#### 3.1.1 Web Application
- **UI Components (React)**: Built with React, TypeScript, and **shadcn-ui**.
- **Routing Service (React Router)**: Manages client-side navigation.
- **State Management Service**: Uses **Zustand** and **TanStack Query**.

#### 3.1.2 Mobile Application
- **UI Components (React Native)**: Built with React Native and **React Native Paper**.
- **Routing Service (Expo Router)**: Manages native navigation.
- **State Management Service**: Uses **React Context** for global state.

### 3.2 Backend Services (Supabase)
- **Authentication Service (Supabase Auth)**: Manages user sign-up, login, and sessions for both clients.
- **Database Service (PostgreSQL)**: The primary data store, with access controlled by Row Level Security (RLS) policies.
- **Business Logic Layer (Edge Functions)**: A suite of serverless functions that encapsulate core business logic, callable from both clients.
- **Real-time Service (Supabase Realtime)**: Pushes live updates to connected clients.

## 4. Process View

This view describes the sequence of interactions for key workflows. The processes are client-agnostic, as both the web and mobile apps interact with the same backend services.

(The existing sequence diagrams for Send Referral, Accept Referral, etc., remain valid as they describe the interaction with the backend, which is shared.)

### 4.1 Send Referral Workflow

```mermaid
sequenceDiagram
    participant User
    participant Frontend (React App)
    participant Backend (Supabase)

    User->>Frontend (React App): Fills and submits the Referral Form
    Frontend (React App)->>Backend (Supabase): Invokes `send-referral` Edge Function with referral data
    activate Backend (Supabase)
    Backend (Supabase)->>Backend (Supabase): Finds best available receiver based on logic (trusted network, availability)
    Backend (Supabase)->>Backend (Supabase): Creates a new record in the `referrals` table with a 10-minute timer
    Backend (Supabase)->>Backend (Supabase): Creates a notification in the `messages` table for the receiver
    deactivate Backend (Supabase)
    Backend (Supabase)-->>Frontend (React App): Returns success and the new referral ID
    Frontend (React App)->>User: Navigates to "Waiting for Response" page and shows confirmation
```

### 4.2 Accepting a Referral (Happy Path)

```mermaid
sequenceDiagram
    actor Pro
    participant Frontend
    participant Supabase as Backend
    participant SenderFrontend as Sender's App

    Pro->>Frontend: Clicks "Accept" on a referral notification
    Frontend->>Supabase: Invokes `inbox-action` Edge Function with { referralId, action: 'accept' }
    activate Supabase

    Supabase->>Supabase: Verifies referral is still 'pending' and not expired
    Supabase->>Supabase: Updates `referrals` table status to 'accepted'
    Supabase->>Supabase: Creates notification for sender in `messages` table
    Supabase-->>Frontend: Returns success response
    deactivate Supabase

    Frontend->>Pro: Shows "Accepted!" confirmation UI

    Note over Supabase, SenderFrontend: Supabase sends real-time event
    Supabase->>SenderFrontend: Real-time message for 'referral.accepted'
    SenderFrontend->>SenderFrontend: Updates UI to show referral was accepted
```

## 5. Development View

This view describes the organization of the source code across the two main projects.

- **`style-referral-ring/` (Web App)**
  - **`src/`**: Contains all web frontend source code (React, shadcn-ui).
- **`clientpass-react-native/` (Mobile App)**
  - **`app/`**: Contains all mobile app screens and routing logic (Expo Router).
  - **`components/`**: Contains reusable React Native components.
- **`supabase/` (Shared Backend)**
  - **`functions/`**: Self-contained Edge Functions callable by both clients.
  - **`migrations/`**: SQL files defining the shared database schema.

## 6. Physical (Deployment) View

The application is deployed on a modern serverless infrastructure.

- **Web Frontend**: The static assets are hosted on **Vercel's** global CDN.
- **Mobile Frontend**: The application is built and deployed to the **Apple App Store** and **Google Play Store** via Expo Application Services (EAS).
- **Backend**: All backend services are hosted on **Supabase**, serving both web and mobile clients.

## 7. Data View

The data architecture is defined by the shared PostgreSQL schema. The ERD remains the same as it represents the single source of truth for both applications.

```mermaid
erDiagram
    users {
        UUID id PK
        string full_name
        string role
        string membership_tier
        string pro_id
        boolean active_mode
        boolean coverage_mode
    }

    referrals {
        UUID id PK
        UUID sender_id FK
        UUID receiver_id FK
        string client_name
        string status
        UUID open_chair_id FK
        UUID hot_seat_id FK
    }

    open_chairs {
        UUID id PK
        UUID user_id FK
        string location
        timestamp start_at
        timestamp end_at
        string status
    }

    hot_seats {
        UUID id PK
        UUID user_id FK
        string service
        timestamp expires_at
    }

    services {
        UUID id PK
        UUID pro_id FK
        string name
        int price_cents
    }

    trusted_network {
        UUID owner_id PK, FK
        UUID partner_id PK, FK
        string status
    }
    
    auto_suggest_tracking {
        UUID user_id PK, FK
        UUID partner_id PK, FK
        int completed_count
    }

    payments {
        UUID id PK
        UUID referral_id FK
        decimal amount
    }
    
    commissions {
        UUID id PK
        UUID referral_id FK
        UUID payee_id FK
        decimal amount
    }

    affiliate_commissions {
        UUID id PK
        UUID referral_id FK
        UUID earner_id FK
        decimal amount
    }

    boosts {
        UUID id PK
        UUID user_id FK
        string boost_type
        timestamp end_at
    }

    ad_placements {
        UUID id PK
        string title
        string category
        boolean active
    }

    messages {
        UUID id PK
        UUID user_id FK
        string title
        string kind
    }

    admin_audit_log {
        UUID id PK
        UUID admin_user_id FK
        string action
    }

    feature_flags {
        string flag_name PK
        boolean enabled
    }

    platform_settings {
        string key PK
        string value
    }

    users ||--o{ referrals : "sends"
    users ||--o{ referrals : "receives"
    users ||--o{ services : "offers"
    users ||--o{ open_chairs : "hosts"
    users ||--o{ hot_seats : "posts"
    users ||--o{ boosts : "activates"
    users ||--o{ messages : "receives"
    users ||--o{ admin_audit_log : "performs"
    users }o--o{ trusted_network : "owns"
    users }o--o{ trusted_network : "is_partner_in"
    users }o--o{ auto_suggest_tracking : "tracks"
    users }o--o{ auto_suggest_tracking : "is_tracked_with"
    users ||--o{ affiliate_commissions : "earns"
    
    referrals }o--|| open_chairs : "books_into"
    referrals }o--|| hot_seats : "is_for"
    referrals ||--o{ payments : "generates"
    referrals ||--o{ commissions : "results_in"
    referrals ||--o{ affiliate_commissions : "generates"
```

For a complete and detailed breakdown of every table and column, please refer to the **`docs/DATABASE_SCHEMA.md`** document.
