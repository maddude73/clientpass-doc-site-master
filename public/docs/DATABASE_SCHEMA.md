---
id: 68dccbb7479feecff6266a7a
revision: 14
---

# Database Schema Overview

This document outlines the structure of the primary tables in the PostgreSQL database managed by Supabase.

## Core Tables

### `users`

Stores user profile information for all roles (stylists, affiliates, clients, etc.). This table is central to identifying and managing users.

- `id`: UUID, primary key, references `auth.users.id`.
- `full_name`: The user's full name.
- `role`: The user's primary role (e.g., 'member', 'referrer', 'pro', 'suiteOwner', 'admin').
- `role_tag`: A specific tag for sub-roles, like 'suite_pro'.
- `pro_id`: A unique identifier for professionals, used for public profiles and matching.
- `membership_tier`: 'free' or 'pro', indicating the user's subscription level.
- `active_mode`: Boolean, if the user is currently available to receive referrals.
- `coverage_mode`: Boolean, if the user has enabled coverage mode to have others handle their clients.
- `stripe_connect_id`: The user's Stripe account ID, used for payouts.
- `phone`, `email`, `zip_code`: Contact and location information.

### `referrals`

The central table for tracking all referral activities from creation to completion.

- `id`: UUID, primary key.
- `sender_id`: The user who sent the referral.
- `receiver_id`: The user who ultimately accepted and is handling the referral.
- `client_name`, `client_phone`: Information for the non-platform client being referred.
- `service_type`: The name of the service requested (e.g., "Haircut & Style").
- `status`: The current status of the referral (e.g., 'pending', 'accepted', 'completed', 'expired').
- `commission_pct`: The commission percentage the referrer will earn.
- `expires_at`: The timestamp when the referral offer expires for the current receiver.
- `response_deadline`: A specific deadline for a professional to respond to an offer.
- `open_chair_id`: A foreign key if the referral was booked into an Open Chair session.
- `hot_seat_id`: A foreign key if the referral was for a Hot Seat offer.

### `open_chairs`

Manages the "Open Chair" marketplace feature, where stylists can offer their workspace to others.

- `id`: UUID, primary key.
- `user_id`: The host offering the chair.
- `location`, `zip_code`: The physical location of the open chair.
- `start_at`, `end_at`: The time window the chair is available.
- `host_pct`: The commission percentage the host earns from services performed in their chair.
- `status`: The current state of the listing ('open', 'accepted', 'live', 'closed').
- `receiver_pro_id`: The stylist who has accepted the open chair session.
- `services_allowed`: An array of service names permitted during the session.

### `hot_seats`

Manages the "Hot Seat" feature, which allows stylists to post last-minute, often discounted, appointment slots.

- `id`: UUID, primary key.
- `user_id`: The stylist offering the hot seat.
- `service`: The name of the service being offered.
- `original_price`, `discount_price`: Pricing for the flash sale.
- `time_slot`: The specific time the service is available (e.g., "ASAP", "2:00 PM").
- `audience`: Defines who receives the alert ('favorites', 'clients', 'local').
- `expires_at`: When the hot seat offer expires.

### `payments` & `commissions`

These tables track all financial transactions within the application.

- **`payments`**: Records every charge processed, such as client deposits or full service payments.
- **`commissions`**: Records the calculated commission amounts earned by referrers or hosts from a completed service.

## Affiliate System Tables

### `affiliate_users`

Stores profiles for users in the affiliate program. This system is separate from the main application's user authentication.

- `id`: UUID, primary key.
- `email`, `first_name`, `last_name`: Affiliate's contact information.
- `status`: The affiliate's account status ('pending', 'approved', 'suspended').

### `affiliate_commissions`

Tracks commissions earned by affiliates, including direct referral commissions and override commissions from their recruited sub-affiliates.

## User Network Tables

### `trusted_network`

Manages a user's list of trusted partners. Referrals can be configured to be sent to this network first.

- `owner_id`: The user who owns this trusted list.
- `partner_id`: The user who is a trusted partner.
- `status`: 'active' or 'pending' (for invites).

### `auto_suggest_tracking`

Tracks interactions (i.e., completed co-op sessions) between users to power the "auto-suggest" feature, which prompts users to add frequently-worked-with professionals to their trusted network.

## Other Key Tables

- **`services`**: A list of all services offered by professionals, including pricing, duration, and category.
- **`boosts`**: Tracks active profile boosts, which increase a user's visibility in search and matching.
- **`ad_placements`**: Stores the "Pro Deals" (advertisements) shown in the marketplace.
- **`messages`**: An inbox system for storing all user notifications (e.g., referral alerts, payment confirmations).
- **`admin_audit_log`**: Records all actions taken by administrators in the Admin Console for security and accountability.
- **`feature_flags`**: A simple table to enable or disable platform features in real-time.
- **`platform_settings`**: Stores global configuration values for the platform, such as fee percentages and feature limits.