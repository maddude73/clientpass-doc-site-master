---
id: 68dccbb7479feecff6266a7e
revision: 14
---

# Edge Functions Overview

This document describes the serverless Edge Functions located in the `supabase/functions/` directory. These functions contain the core backend business logic for the application.

---

### `accept-open-chair`

- **Purpose**: Allows a stylist to accept an available "Open Chair" slot.
- **Input**: `{ "open_chair_id": "uuid" }`
- **Logic**:
  1. Validates the user and the `open_chair_id`.
  2. Checks if the chair is still available and not already locked by another user.
  3. Creates a 10-minute "acceptance lock" to prevent concurrent bookings, associating the current user with the chair.
  4. Notifies the host that a stylist is reviewing their offer.

---

### `auto-tag-booking`

- **Purpose**: Automatically associates a new booking with a stylist's currently active "Open Chair" session if the booking criteria match.
- **Input**: `{ "referral_id": "uuid" }`
- **Logic**:
  1. Triggered when a referral is created or updated.
  2. Checks if the receiving stylist has a `live` Open Chair session.
  3. If the booking's time and location match the live session, it tags the `referral` record with the `open_chair_id`.

---

### `check-in-open-chair`

- **Purpose**: Allows a stylist to "check in" upon arrival at the host's location, officially starting the live session.
- **Input**: `{ "open_chair_id": "uuid" }`
- **Logic**:
  1. Verifies that the user is the one who accepted the chair.
  2. Updates the `open_chairs` status from 'accepted' to 'live'.
  3. Notifies both the host and the stylist that the session has begun.

---

### `complete-referral-tracking`

- **Purpose**: Tracks a completed co-op between two professionals to power the "auto-suggest" trusted network feature.
- **Input**: `{ "referral_id": "uuid" }`
- **Logic**:
  1. Identifies the two professionals involved in a `completed` referral.
  2. Increments the `completed_count` in the `auto_suggest_tracking` table for both directions of the relationship (A->B and B->A).

---

### `confirm-open-chair`

- **Purpose**: The second step in the acceptance process, where a stylist confirms their decision within the 10-minute lock window.
- **Input**: `{ "open_chair_id": "uuid" }`
- **Logic**:
  1. Verifies the user and the lock's validity.
  2. Updates the `open_chairs` status to 'accepted' and clears the lock.
  3. Notifies both parties of the confirmation.

---

### `create-checkout`

- **Purpose**: Creates a Stripe Checkout session for a user to subscribe to the Pro plan.
- **Input**: None (uses user's auth token).
- **Logic**:
  1. Finds or creates a Stripe Customer ID for the user.
  2. Creates and returns a Stripe Checkout session URL for the subscription.

---

### `customer-portal`

- **Purpose**: Creates a Stripe Billing Portal session for a user to manage their existing subscription.
- **Input**: None.
- **Logic**:
  1. Retrieves the user's Stripe Customer ID.
  2. Creates and returns a Stripe Billing Portal session URL.

---

### `ensure-demo-user`

- **Purpose**: Creates or verifies the existence of a demo user account for various roles (e.g., pro, client, admin).
- **Input**: `{ "email": "string", "role": "string", "password": "string" }`
- **Logic**:
  1. Checks if a user with the specified email exists.
  2. If not, it creates a new user in Supabase Auth and a corresponding profile in the `users` table with the specified role.
  3. This function is used to ensure that demo accounts are always available for use in the login form.

---

### `end-open-chair-session`

- **Purpose**: Ends a live "Open Chair" session, calculates final earnings, and triggers settlement.
- **Input**: `{ "open_chair_id": "uuid" }`
- **Logic**:
  1. Updates the chair status to 'completed'.
  2. Fetches all bookings associated with the session.
  3. Invokes the `settle-open-chair-commission` function for each completed booking to distribute funds.
  4. Notifies both parties with a summary of the session.

---

### `ensure-demo-user`

- **Purpose**: Ensures a demo user exists for demonstration purposes, creating it if it doesn't.
- **Input**: None
- **Logic**:
  1. Checks for a user with a specific demo email.
  2. If the user doesn't exist, it creates a new user with pre-defined demo data.
  3. Returns the demo user's data.

---

---

### `inbox-action`

- **Purpose**: Handles user actions from the inbox, specifically for accepting or declining referrals.
- **Input**: `{ "referral_id": "uuid", "action": "accept" | "decline" }`
- **Logic**:
  - **Accept**: Checks if the referral is still available and, if so, updates its status to 'accepted'.
  - **Decline**: Invokes the `reassign-referral` function to find the next available professional.

---

### `post-open-chair`

- **Purpose**: Creates a new "Open Chair" listing.
- **Input**: `{ location, start_at, end_at, services_allowed, host_pct, ... }`
- **Logic**:
  1. Validates the input data (e.g., time window, commission range).
  2. Inserts a new record into the `open_chairs` table.
  3. Identifies eligible stylists based on the `audience` setting (all vs. trusted) and sends them notifications.

---

### `purchase-boost`

- **Purpose**: Allows a user to purchase or use a free credit for a profile boost.
- **Input**: `{ boost_type, duration_hours, amount }`
- **Logic**:
  1. Checks if the user has a free boost available (if they are a Pro member).
  2. Creates or extends a record in the `boosts` table.
  3. If a payment is required, it would integrate with a payment provider (currently simulated).

---

### `reassign-referral`

- **Purpose**: Finds the next available professional for a referral that was declined or expired.
- **Input**: `{ "referralId": "uuid" }`
- **Logic**:
  1. Identifies the professionals who have already been offered the referral.
  2. Queries for the next best-matching available stylist, excluding those who have already been tried.
  3. If a new stylist is found, updates the `referrals` record with the new `receiver_id` and resets the `expires_at` timer.
  4. If not, marks the referral as 'declined'.

---

### `send-referral`

- **Purpose**: The main function for initiating a new referral.
- **Input**: `{ referralData: { clientName, serviceId, ... } }`
- **Logic**:
  1. Finds the best available receiver based on the sender's trusted network, service type, and availability.
  2. If the sender has `coverage_mode` enabled, it assigns the referral to the sender themselves.
  3. Creates a new record in the `referrals` table with a 'pending' status and a 10-minute response timer.
  4. Sends a notification to the receiving stylist.
  5. Creates a client referral link for the client to track the referral status.

---

### `send-trusted-invite`

- **Purpose**: Sends an email invitation to a professional to join the user's Trusted Network.
- **Input**: `{ "inviteEmail": "string", "senderName": "string" }`
- **Logic**: Uses the Resend service to dispatch a formatted email invitation containing a unique sign-up link.

---

### `set-modes`

- **Purpose**: A simple utility function to toggle a user's `active_mode` or `coverage_mode`.
- **Input**: `{ "active_mode": boolean }` or `{ "coverage_mode": boolean }`
- **Logic**: Updates the corresponding boolean field on the user's profile in the `users` table.

---

### `settle-open-chair-commission`

- **Purpose**: Calculates and records commission splits for a single booking within an Open Chair session.
- **Input**: `{ "referral_id": "uuid", "service_price": number, ... }`
- **Logic**:
  1. Fetches the host's commission percentage (`host_pct`) from the `open_chairs` table.
  2. Calculates the platform fee, host share, and stylist's net earnings.
  3. Accounts for outside referrers, who earn 10% taken from the host's share.
  4. Inserts records into the `commissions` table to log the transaction for all parties.

---

### `upsert-profile`

- **Purpose**: Creates or updates a user's profile in the `users` table, typically after initial sign-up.
- **Input**: `{ fullName, role, ... }`
- **Logic**: Uses `upsert` logic to either create a new user profile linked to the `auth.users` record or update an existing one.
