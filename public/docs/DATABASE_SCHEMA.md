```markdown
# Database Schema Overview

**Last Updated**: November 8, 2025

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
- **New Fields**:
  - Service catalog preferences and AI feature preferences (opt-in/opt-out).
  - Embedding storage for profile matching.

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
- **New Fields**:
  - `adjustment_status`: Status of any adjustments made to the referral.
  - `last_adjusted_at`: Timestamp of the last adjustment.
  - `rebooked_from`: Links repeat bookings.
  - `catalog_service_id`: References the standardized service catalog.
  - `service_id`: References the `service_catalog` table for service taxonomy.

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

## Service Catalog Tables

### `service_catalog`

Centralized catalog of all available services on the platform. Enables standardized service management and taxonomy.

- `id`: UUID, primary key.
- `name`: Standardized service name (e.g., "Women's Haircut").
- `category`: Top-level category (e.g., "Hair", "Nails", "Skincare").
- `subcategory`: More specific categorization within the category.
- `description`: Detailed description of the service.
- `typical_duration`: Average duration in minutes for the service.
- `typical_price_range`: Suggested price range as JSONB (e.g., {"min": 50, "max": 150}).
- `requires_consultation`: Boolean indicating if consultation is recommended.
- `active`: Boolean indicating if the service is currently offered.
- `created_at`, `updated_at`: Timestamps for tracking.
- **New Fields**:
  - `price_cents`: Integer, price in cents.
  - `duration_minutes`: Integer, duration in minutes.
  - `deposit_pct`: Integer, deposit percentage.

### `referral_adjustments`

Tracks all modifications made to referrals after initial creation, including service changes, price adjustments, and duration modifications.

- `id`: UUID, primary key.
- `referral_id`: UUID, foreign key to referrals table.
- `adjustment_type`: TEXT, type of adjustment ('service_add', 'service_remove', 'price_change', 'duration_change').
- `original_value`: JSONB, the original value before adjustment.
- `new_value`: JSONB, the new value after adjustment.
- `reason`: TEXT, explanation for the adjustment.
- `price_impact`: NUMERIC, the financial impact of the adjustment.
- `requested_by`: UUID, the user who requested the adjustment.
- `status`: TEXT, approval status ('pending', 'approved', 'declined', 'auto_approved').
- `approved_by`: UUID, nullable, the user who approved the adjustment.
- `approved_at`: TIMESTAMP, when the adjustment was approved.
- `created_at`, `updated_at`: Timestamps for tracking.

### `booking_history`

Complete record of all appointments and bookings for quick rebook functionality.

- `id`: UUID, primary key.
- `client_id`: UUID, reference to the client.
- `professional_id`: UUID, reference to the professional.
- `referral_id`: UUID, nullable, link to referral if applicable.
- `services`: JSONB, array of services performed.
- `total_price`: NUMERIC, total cost of the appointment.
- `duration`: INTEGER, total duration in minutes.
- `appointment_date`: TIMESTAMP, when the service occurred.
- `location`: TEXT, where the service was performed.
- `status`: TEXT, completion status ('completed', 'cancelled', 'no_show').
- `rating`: INTEGER, nullable, client rating (1-5).
- `review`: TEXT, nullable, client review text.
- `created_at`, `updated_at`: Timestamps.

### `rebook_preferences`

User preferences for quick rebooking features.

- `user_id`: UUID, foreign key to users table.
- `default_services`: JSONB, array of preferred service IDs.
- `preferred_times`: JSONB, preferred time slots (e.g., {"weekday": "afternoon", "weekend": "morning"}).
- `preferred_professionals`: UUID[], array of preferred professional IDs.
- `auto_suggest_enabled`: BOOLEAN, whether to show AI suggestions.
- `notification_preferences`: JSONB, how user wants to be notified of rebook opportunities.
- `updated_at`: TIMESTAMP.

## AI Integration Tables

### `ai_configurations`

Stores AI provider settings and system prompts for dynamic configuration.

- `id`: UUID, primary key.
- `provider`: TEXT, AI provider name ('google', 'openai', 'anthropic', 'ollama').
- `model`: TEXT, specific model identifier (e.g., 'gemini-2.5-flash', 'gpt-5').
- `api_key`: TEXT, encrypted API key for the provider.
- `system_prompt`: TEXT, default system prompt for the provider.
- `max_tokens`: INTEGER, maximum tokens per request.
- `temperature`: NUMERIC, model temperature setting (0.0-1.0).
- `active`: BOOLEAN, whether this configuration is currently in use.
- `created_at`, `updated_at`: Timestamps.

### `ai_usage_tracking`

Logs all AI API calls for monitoring, cost tracking, and analytics.

- `id`: UUID, primary key.
- `user_id`: UUID, nullable, user who initiated the request.
- `provider`: TEXT, which AI provider was used.
- `model`: TEXT, specific model used.
- `operation`: TEXT, type of operation ('chat', 'embedding', 'stream').
- `tokens_used`: INTEGER, total tokens consumed.
- `cost_estimate`: NUMERIC, estimated cost in USD.
- `latency_ms`: INTEGER, response time in milliseconds.
- `success`: BOOLEAN, whether the request succeeded.
- `error_message`: TEXT, nullable, error details if failed.
- `timestamp`: TIMESTAMP, when the request occurred.

### `ai_embeddings`

Stores vector embeddings for semantic search and similarity matching.

- `id`: UUID, primary key.
- `content_type`: TEXT, what was embedded ('profile', 'service', 'review', 'document').
- `content_id`: UUID, reference to the embedded content.
- `embedding_vector`: VECTOR(1536), the embedding vector.
- `model_used`: TEXT, which model generated the embedding.
- `created_at`: TIMESTAMP.
- **Index**: pgvector index on `embedding_vector` for fast similarity search.

## Other Key Tables

- **`services`**: A list of all services offered by professionals, including pricing, duration, and category. _Note: This table is being transitioned to reference the `service_catalog` for standardization._
- **`boosts`**: Tracks active profile boosts, which increase a user's visibility in search and matching.
- **`ad_placements`**: Stores the "Pro Deals" (advertisements) shown in the marketplace.
- **`messages`**: An inbox system for storing all user notifications (e.g., referral alerts, payment confirmations).
- **`admin_audit_log`**: Records all actions taken by administrators in the Admin Console for security and accountability.
- **`feature_flags`**: A simple table to enable or disable platform features in real-time.
- **`platform_settings`**: Stores global configuration values for the platform, such as fee percentages and feature limits.

## Recent Schema Changes (November 2025)

### New Features Added

1. **AI Integration Layer** (November 2025):

   - `ai_configurations`: Dynamic AI provider configuration
   - `ai_usage_tracking`: Complete audit trail of AI operations
   - `ai_embeddings`: Vector storage for semantic search (pgvector)

2. **Service Catalog System** (October 2024):
   - `service_catalog`: Centralized service management
   - Enhanced taxonomy with categories and subcategories

3. **Referral Adjustments** (October 2024):

   - `referral_adjustments`: Post-creation modification tracking
   - Auto-confirmation support via edge functions

4. **Quick Rebook System** (November 2025):
   - `booking_history`: Complete appointment records
   - `rebook_preferences`: User rebooking preferences and AI suggestions

### Modified Tables

- **`referrals`**:
  - Added `adjustment_status` and `last_adjusted_at` fields
  - Added `rebooked_from` field to link repeat bookings
  - Added `catalog_service_id` references
  - Added `service_id` to support new service taxonomy

- **`services`**:

  - Added `catalog_service_id` field to link to standardized catalog entries
  - Transitioning from independent service definitions to catalog references

- **`users`**:
  - Enhanced with service catalog preferences
  - Added AI feature preferences (opt-in/opt-out)
  - Added embedding storage for profile matching

### Indexes Added

1. **Performance Indexes**:

   - `idx_referrals_adjustment_status` on `referrals(adjustment_status)`
   - `idx_booking_history_client` on `booking_history(client_id, appointment_date DESC)`
   - `idx_ai_usage_timestamp` on `ai_usage_tracking(timestamp DESC)`

2. **Vector Similarity Indexes** (pgvector extension):
   - `idx_ai_embeddings_vector` on `ai_embeddings` using IVFFlat or HNSW
   - Enables fast cosine similarity searches for matching

### Database Extensions

- **pgvector**: Required for AI embeddings and semantic search
- **pg_cron**: For scheduled tasks (auto-confirm adjustments, cleanup)
- **uuid-ossp**: For UUID generation

### Migration Strategy

For developers pulling these changes:

1. Run all pending migrations in `supabase/migrations/`
2. Install pgvector extension: `CREATE EXTENSION vector;`
3. Run seed data for service catalog: `psql < seed/service_catalog.sql`
4. Update `.env` with AI provider API keys
5. Rebuild embeddings for existing content: Run `edge-function/rebuild-embeddings`
```