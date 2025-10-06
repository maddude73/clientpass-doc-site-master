# Referral Timers

This document provides a detailed description of the Referral Timers feature.

## 1. Overview

The Referral Timers page provides a real-time dashboard for stylists to manage their incoming and outgoing referrals. It is a crucial feature for ensuring that referrals are handled in a timely manner.

The page is implemented in the `ReferralTimersPage.tsx` page, which wraps the `ReferralTimerDashboard.tsx` component.

## 2. Features

### 2.1. Real-time Updates

- The page uses Supabase real-time subscriptions to listen for changes to the `referrals` table.
- This means that the dashboard is always up to date with the latest referral information, without the need for manual refreshing.
- The page also auto-refreshes every 30 seconds as a fallback to keep the timers accurate.

### 2.2. Sent and Received Referrals

- The dashboard is divided into two tabs: "Sent" and "Received".
- The "Sent" tab shows a list of referrals that the logged-in stylist has sent to other stylists.
- The "Received" tab shows a list of referrals that have been sent to the logged-in stylist.
- Each tab shows a count of the number of referrals.

### 2.3. Referral Card

Each referral is displayed on a card with the following information:

- Client's name.
- Status of the referral (e.g., `pending`, `waiting_response`, `accepted`).
- The name of the sender or receiver.
- Potential earnings from the referral, including the estimated service price and the commission.
- A countdown timer for pending referrals, showing how much time is left to respond.
- Details about the service, location, and client's phone number.
- Any notes included with the referral.

### 2.4. Accept/Decline Referrals

- For received referrals that are in a `pending` state, the stylist has the option to "Accept" or "Decline".
- **Accepting** a referral updates its status to `accepted` and moves it to the stylist's pending list.
- **Declining** a referral triggers a Supabase Edge Function (`reassign-referral`) to find the next available professional.

### 2.5. Demo Mode

- The page includes a button to "+ Add Demo Referral".
- This allows users to create a new referral with a fresh 10-minute timer, which is useful for demonstrating the feature.

## 3. Data Model

The Referral Timers feature interacts with the `referrals` and `users` tables in the Supabase database.

## 4. User Interface

The user interface consists of:

- A header with a back button and a title.
- A tabbed interface to switch between "Sent" and "Received" referrals.
- A list of referral cards, each with detailed information and action buttons.
