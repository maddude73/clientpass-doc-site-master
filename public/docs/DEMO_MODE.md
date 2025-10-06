# Demo Mode

This document provides a comprehensive guide to the Demo Mode feature in the ClientPass application.

## 1. Overview

The application includes a comprehensive Demo Mode to allow for safe testing, development, and demonstration of all features without affecting live data. When enabled, this mode simulates the entire backend, including payments, notifications, and data seeding, providing a consistent and predictable environment.

## 2. Key Features

### 2.1. Centralized Configuration

-   **Activation:** Demo mode is controlled by a single boolean flag, `DEMO_MODE`, located in the `DEMO_CONFIG` object in `src/config/demoConfig.ts`.
-   **Fine-Grained Control:** The `DEMO_CONFIG` object also allows for fine-grained control over various aspects of the demo mode, such as the number of demo users to create, the latency of simulated API calls, and the likelihood of certain events (e.g., a referral being accepted).

### 2.2. Automatic Data Seeding

-   **Consistent Data:** The `DemoDataSeeder` service (`src/services/demo/DemoDataSeeder.ts`) is responsible for populating the application with a consistent set of demo data.
-   **Demo Personas:** This includes creating a variety of demo users with different roles (professionals, clients, suite owners, affiliates), each with their own profile information, bookings, and referral history.
-   **Realistic Scenarios:** The seeder also creates open chair opportunities and other data points to simulate a realistic and active environment.

### 2.3. Simulated Services

All major backend services have demo implementations that mimic the behavior of the live services:

-   **`DemoAdmin`:** Manages demo-specific feature flags and simulates the process of applying for and being approved as a professional or suite owner.
-   **`DemoBooking`:** Handles all booking-related operations, including creating, confirming, and canceling appointments. It simulates the entire booking lifecycle without creating any real appointments.
-   **`DemoMatching`:** Provides a simulated professional matching service. It can be configured to return different results based on various filters, allowing for testing of the matching algorithm.
-   **`DemoNotifications`:** Simulates the sending of push, SMS, and email notifications for key events like new referrals, appointment confirmations, and payment receipts. Instead of sending real notifications, it logs the notification content to the console.
-   **`DemoPayments`:** Mimics the Stripe API for creating payment intents, processing payments, and handling payouts. This allows for end-to-end testing of the payment flow without using real credit cards or making actual transactions.

### 2.4. `useDemoMode` Hook

-   **Easy Access:** The `useDemoMode` hook (`src/hooks/useDemoMode.ts`) provides a simple and convenient way for components to access the demo mode status and the demo data.
-   **Automatic Initialization:** The hook also handles the initialization of the demo environment, including the seeding of demo data, when the application starts in demo mode.

## 3. Benefits of Demo Mode

-   **Safe Testing:** Allows developers and QA testers to test new features and bug fixes in a safe and isolated environment without the risk of corrupting live data.
-   **Rapid Prototyping:** Enables rapid prototyping and iteration of new ideas without the need to set up a full backend environment.
-   **Sales and Marketing Demonstrations:** Provides a consistent and reliable environment for demonstrating the application's features to potential customers and partners.
-   **Offline Development:** Allows developers to work on the frontend of the application even when they are not connected to the internet.

## 4. Enabling Demo Mode

To enable Demo Mode, set the `DEMO_MODE` flag to `true` in `src/config/demoConfig.ts`:

```typescript
// src/config/demoConfig.ts
export const DEMO_CONFIG = {
  // ...
  DEMO_MODE: true,
  // ...
};
```

When Demo Mode is active, the application will use the demo services instead of the live backend services. This allows for end-to-end testing of user flows in a controlled and predictable environment.