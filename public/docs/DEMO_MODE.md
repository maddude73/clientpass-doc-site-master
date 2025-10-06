---
id: 68dccbb7479feecff6266a7c
revision: 10
---

# Demo Mode

The application includes a comprehensive Demo Mode to allow for safe testing and demonstration of all features without affecting live data. This mode is controlled by a central configuration and simulates the entire backend, including payments, notifications, and data seeding.

## Key Features

- **Centralized Configuration**: Demo mode is enabled via the `DEMO_CONFIG` object in `src/config/demoConfig.ts`. The `DEMO_MODE` flag controls the activation of all demo functionalities.
- **Data Seeding**: The `DemoDataSeeder` service (`src/services/demo/DemoDataSeeder.ts`) creates a consistent set of demo users (professionals, clients, owners, affiliates), bookings, and open chair opportunities. This ensures a predictable environment for testing.
- **Simulated Services**: All major services have demo implementations:
    - `DemoAdmin`: Manages demo feature flags and business applications.
    - `DemoBooking`: Handles all booking-related operations, including creation, confirmation, and cancellation.
    - `DemoMatching`: Provides a simulated professional matching service with configurable filters.
    - `DemoNotifications`: Simulates sending push, SMS, and email notifications for key events.
    - `DemoPayments`: Mimics the Stripe API for creating payment intents, transfers, and payouts without actual transactions.
- **`useDemoMode` Hook**: The `useDemoMode` hook (`src/hooks/useDemoMode.ts`) provides a simple way for components to access demo mode status and data. It also handles the initialization of the demo environment.

## Enabling Demo Mode

To enable Demo Mode, set the `DEMO_MODE` flag to `true` in `src/config/demoConfig.ts`:

```typescript
// src/config/demoConfig.ts
export const DEMO_CONFIG = {
  // ...
  DEMO_MODE: true,
  // ...
};
```

When Demo Mode is active, the application will use the demo services instead of live backend services. This allows for end-to-end testing of user flows in a controlled environment.
