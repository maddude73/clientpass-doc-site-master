# Sizing & Effort Estimates

This document provides high-level, relative effort estimates for the user stories in the project backlog. These are for initial planning and prioritization purposes and are subject to change after more detailed analysis.

**Sizing Legend:**
- **XS**: Extra Small (Trivial task)
- **S**: Small (Straightforward task)
- **M**: Medium (Moderately complex feature)
- **L**: Large (Complex feature with multiple parts)
- **XL**: Extra Large (Epic-level feature that needs to be broken down)

---

## Epic: User Authentication & Onboarding

- **Story**: As a stylist, I want to sign up with my email and password so I can create an account and access the platform.
  - **Estimate**: **M** (Includes UI, Supabase Auth integration, and profile creation).
- **Story**: As a new user, I want to be guided through setting up my profile so I can start receiving referrals.
  - **Estimate**: **M** (Involves a multi-step UI flow and profile updates).
- **Story**: As an affiliate, I want to sign up for the affiliate program so I can start earning commissions.
  - **Estimate**: **L** (Requires a separate auth system and admin approval flow).
- **Story**: As a user, I want to be able to log in securely and log out of my account.
  - **Estimate**: **S** (Largely handled by Supabase Auth).

## Epic: Referral Management

- **Story**: As a busy stylist, I want to quickly send a walk-in client I can't serve to another stylist so I can earn a commission.
  - **Estimate**: **M** (Core feature involving a complex form and backend logic).
- **Story**: As a stylist, I want to receive instant notifications for new referrals so I don't miss opportunities.
  - **Estimate**: **M** (Requires real-time database features and push notifications).
- **Story**: As a stylist, I want a 10-minute window to accept or decline a referral so I have time to check my schedule.
  - **Estimate**: **L** (Involves backend timers, cron jobs, and state management).
- **Story**: As a sender, I want the system to automatically reassign an expired or declined referral to the next best stylist.
  - **Estimate**: **L** (Complex backend logic for matching and reassignment).

## Epic: Open Chair Marketplace

- **Story**: As a salon owner, I want to post my available chairs so I can monetize empty space.
  - **Estimate**: **M** (Requires a dedicated form and database schema).
- **Story**: As a stylist, I want to find and book a temporary chair to work from so I can serve my clients.
  - **Estimate**: **L** (Involves search, filtering, and a booking workflow).
- **Story**: As a host, I want to track all services performed in my chair during a session so I can get my correct commission.
  - **Estimate**: **L** (Requires a "Live Session" dashboard with real-time updates).

## Epic: Hot Seat (Flash Sales)

- **Story**: As a stylist, I want to post a last-minute discounted appointment so I can fill a cancellation.
  - **Estimate**: **L** (A full feature slice involving a new form, data model, and notification logic).

## Epic: Coverage Mode

- **Story**: As a stylist going on vacation, I want to enable "Coverage Mode" so my incoming client requests are automatically forwarded to trusted colleagues.
  - **Estimate**: **L** (Requires changes to user settings and core referral routing logic).
- **Story**: As a stylist, I want to add trusted colleagues to my "Coverage List" to handle my clients when I'm away.
  - **Estimate**: **M** (UI for managing a list of users).

## Epic: Financials & Earnings

- **Story**: As a user, I want to see a dashboard of my total, pending, and available earnings.
  - **Estimate**: **M** (Requires data aggregation and a dedicated UI).
- **Story**: As a user, I want to connect my Stripe account so I can receive payouts.
  - **Estimate**: **L** (Stripe Connect integration is complex and involves security considerations).

## Epic: Profile & Network Management

- **Story**: As a stylist, I want to build a public profile with my services, prices, and portfolio.
  - **Estimate**: **M** (Involves multiple form sections and data models).
- **Story**: As a user, I want to add professionals I've worked with to a "Trusted Network".
  - **Estimate**: **M** (UI for searching and adding users to a list).
- **Story**: As a user, I want the app to suggest adding a professional to my Trusted Network after we have successfully collaborated.
  - **Estimate**: **M** (Requires backend tracking and a new UI prompt).

## Epic: Affiliate Program

- **Story**: As an affiliate, I want a unique referral link to share so I can track my sign-ups.
  - **Estimate**: **XL** (This represents the entire affiliate system, which is a major undertaking involving separate auth, tracking, dashboards, and commission logic).

## Epic: Administration

- **Story**: As an admin, I want to manage "Pro Deals" that are offered to all users.
  - **Estimate**: **M** (CRUD interface for the `ad_placements` table).
- **Story**: As an admin, I want to export user and transaction data for analysis.
  - **Estimate**: **L** (Requires a secure backend process to generate and serve large CSV files).
