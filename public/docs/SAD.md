# Software Architecture Document (SAD)

## 1. Introduction

### 1.1 Purpose
This document provides a comprehensive architectural overview of the ClientPass application. It is intended for developers, architects, and technical stakeholders to understand the system's structure, components, interactions, and design principles.

### 1.2 Scope
The scope of this document covers the frontend web application, the serverless backend, the database schema, and the deployment strategy for the ClientPass platform.

### 1.3 Architectural Representation
This document uses a simplified version of the **4+1 architectural view model** to describe the system from different perspectives:
- **Logical View**: The system's functional components and their responsibilities.
- **Process View**: The system's dynamic behavior and component interactions.
- **Development View**: The organization of the source code and build system.
- **Physical (Deployment) View**: The mapping of software components to the physical infrastructure.
- **Data View**: The structure and organization of the data.

## 2. System Architecture Diagram

This diagram provides a detailed, high-level view of the entire system architecture, including network boundaries, services, and dependencies.

```mermaid
graph TB
    subgraph "User's Device"
        User["🧍<br/>User"]
    end

    subgraph "Vercel CDN"
        direction LR
        Frontend[React SPA]
    end

    User -- "HTTPS" --> Frontend

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

    Frontend -- "HTTPS/WSS" --> Gateway

    subgraph "Third-Party APIs"
        direction TB
        Stripe[Stripe API]
        Resend[Resend API]
    end

    EdgeFunctions -- "HTTPS" --> Stripe
    EdgeFunctions -- "HTTPS" --> Resend

    style Frontend fill:#61DAFB,color:#000
    style Gateway fill:#F48024,color:#fff
    style Database fill:#336791,color:#fff
    style Stripe fill:#6772e5,color:#fff
```

## 3. Logical View

This diagram illustrates the high-level logical components of the system and their primary relationships.

```mermaid
graph TD
    subgraph "User's Browser"
        A[React SPA Frontend]
    end

    subgraph "Supabase Cloud"
        B[Authentication]
        C[Database - PostgreSQL]
        D[Edge Functions - Deno]
        E[Real-time Service]
    end

    subgraph "Third-Party Services"
        F[Stripe API]
        G[Resend API]
    end

    A -- "HTTPS/WSS for Auth & Data" --> B
    A -- "HTTPS/WSS for Data" --> C
    A -- "HTTPS for Business Logic" --> D
    A -- "WSS for Real-time Updates" --> E

    D -- "DB Connection" --> C
    D -- "HTTPS API Call" --> F
    D -- "HTTPS API Call" --> G
```

The system is decomposed into two main containers: the Frontend Application and the Backend Services.

### 3.1 Frontend Application (Client-Side)
- **UI Components (React)**: A collection of pages, forms, and custom components built with React, TypeScript, and shadcn-ui.
- **Routing Service (React Router)**: Manages client-side navigation and renders the appropriate page components.
- **State Management Service**: Utilizes TanStack Query for managing server state (caching, re-fetching) and React Context for global UI state like authentication.
- **API Client Service (Supabase JS Client)**: The sole interface for communicating with the backend. It handles API requests to the database and invokes Edge Functions.

### 3.2 Backend Services (Supabase)
- **Authentication Service (Supabase Auth)**: Manages user sign-up, login, and session management.
- **Database Service (PostgreSQL)**: The primary data store, with access controlled by Row Level Security (RLS) policies.
- **Business Logic Layer (Edge Functions)**: A suite of serverless functions that encapsulate core business logic (e.g., `send-referral`, `settle-open-chair-commission`).
- **Real-time Service (Supabase Realtime)**: Pushes live updates to connected clients (e.g., for referral status changes).

## 4. Process View

This view describes the sequence of interactions for key workflows in the system.

### 4.1 Send Referral Workflow

This diagram shows the process when a user sends a new referral.

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

This diagram shows the process when a stylist successfully accepts a referral notification.

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

### 4.3 Handling an Expired Referral

This diagram illustrates the automated backend process when a referral is not accepted in time.

```mermaid
sequenceDiagram
    actor Scheduler
    participant CronJob as Cron Job (referral-timer)
    participant Supabase as Backend
    participant NextProFrontend as Next Pro's App

    Scheduler->>CronJob: Triggers every minute
    activate CronJob
    CronJob->>Supabase: Queries for `referrals` where `status` is 'pending' AND `expires_at` < now()
    activate Supabase
    Supabase-->>CronJob: Returns list of expired referrals
    deactivate Supabase

    loop For each expired referral
        CronJob->>Supabase: Invokes `reassign-referral` Edge Function
        activate Supabase
        Supabase->>Supabase: Finds next best available Pro, excluding previous receivers
        alt Next Pro Found
            Supabase->>Supabase: Updates `referrals` record with new `receiver_id` and new `expires_at`
            Supabase->>Supabase: Creates notification for the new Pro in `messages` table
            Supabase->>NextProFrontend: (Later) Sends real-time notification
        else No Pro Found
            Supabase->>Supabase: Updates `referrals` status to 'expired'
            Supabase->>Supabase: Notifies original sender that no one was found
        end
        deactivate Supabase
    end
    deactivate CronJob
```

### 4.4 Open Chair Session Workflow

This diagram shows the end-to-end flow of a stylist using an Open Chair, from check-in to settlement.

```mermaid
sequenceDiagram
    actor Pro
    participant Frontend
    participant Supabase as Backend

    Pro->>Frontend: Clicks "Check In" for an accepted Open Chair
    Frontend->>Supabase: Invokes `check-in-open-chair` Edge Function
    activate Supabase
    Supabase->>Supabase: Updates `open_chairs` status to 'live'
    Supabase-->>Frontend: Returns success
    deactivate Supabase
    Frontend->>Pro: Displays "Live Session" dashboard

    Note over Pro, Backend: During the session, the Pro performs services...

    Pro->>Frontend: Logs a completed service (e.g., via a button in the Live Session UI)
    Frontend->>Supabase: Updates a `referrals` record status to 'completed' and sets `open_chair_id`

    Note over Pro, Backend: At the end of the day...

    Pro->>Frontend: Clicks "End Session"
    Frontend->>Supabase: Invokes `end-open-chair-session` Edge Function
    activate Supabase
    Supabase->>Supabase: Updates `open_chairs` status to 'completed'
    Supabase->>Supabase: Fetches all associated `referrals` marked as completed during the session
    loop For each completed service
        Supabase->>Supabase: Invokes `settle-open-chair-commission` function
        activate Supabase
        Supabase->>Supabase: Calculates platform fee, host share, and stylist net
        Supabase->>Supabase: Inserts records into `commissions` table for host and stylist
        deactivate Supabase
    end
    Supabase-->>Frontend: Returns success
    deactivate Supabase
    Frontend->>Pro: Shows session summary and total earnings
```

## 5. Development View

This view describes the organization of the source code.

- **`style-referral-ring/` (Root)**
  - **`src/`**: Contains all frontend source code.
    - **`components/`**: Reusable React components, organized by feature.
    - **`pages/`**: Top-level components for each application route.
    - **`contexts/`**: Global state providers (e.g., `AuthContext`).
    - **`integrations/`**: Supabase client setup.
  - **`supabase/`**: Contains all backend code and configuration.
    - **`functions/`**: Each sub-directory is a self-contained Edge Function.
    - **`migrations/`**: Contains SQL files that define the database schema history.
  - **`docs/`**: Contains all project documentation, including this SAD.
  - **`package.json`**: Manages all Node.js dependencies for the frontend.
  - **`vite.config.ts`**: Configuration for the Vite build tool.

## 6. Physical (Deployment) View

The application is deployed on a modern serverless infrastructure.

- **Frontend**: The static assets (HTML, CSS, JS) generated by the Vite build process are hosted on **Vercel's** global CDN. This provides fast load times for users worldwide.
- **Backend**: All backend services are hosted on **Supabase**.
  - **Database**: A managed PostgreSQL instance running in the cloud.
  - **Edge Functions**: Deployed to a globally distributed network of Deno-based runtimes, ensuring low-latency execution of backend logic.
  - **File Storage**: Supabase Storage is used for user-uploaded assets like profile photos.

## 7. Data View

The data architecture is defined by the PostgreSQL schema. The following Entity-Relationship Diagram (ERD) illustrates the relationships between the core entities of the system.

```mermaid
erDiagram
    users {
        UUID id PK
        string full_name
        string role
        string pro_id
        string membership_tier
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
    }

    payments {
        UUID id PK
        UUID referral_id FK
        decimal amount
    }

    boosts {
        UUID id PK
        UUID user_id FK
        string boost_type
        timestamp end_at
    }

    suite_referral_tracking {
        UUID id PK
        UUID suite_owner_id FK
        UUID referral_id FK
    }

    users ||--o{ referrals : "sends"
    users ||--o{ referrals : "receives"
    users ||--o{ services : "offers"
    users ||--o{ open_chairs : "hosts"
    users ||--|{ trusted_network : "builds"
    users ||--o{ hot_seats : "posts"
    users ||--o{ boosts : "activates"

    referrals }o--|| open_chairs : "can be booked in"
    referrals }o--|| hot_seats : "can be for"
    referrals ||--o{ payments : "generates"
    referrals ||--o{ suite_referral_tracking : "is tracked in"

    users }o--|| suite_referral_tracking : "owns"
```

For a complete and detailed breakdown of every table and column, please refer to the **`docs/DATABASE_SCHEMA.md`** document.