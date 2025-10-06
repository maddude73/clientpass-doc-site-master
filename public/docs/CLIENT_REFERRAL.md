# Client Referral

This document provides a detailed description of the Client Referral feature.

## 1. Overview

The Client Referral feature allows a client to book an appointment with a stylist based on a referral link. This link is typically sent to the client by another stylist or by the ClientPass system.

The page is implemented in the `ClientReferral.tsx` page, which wraps the `ClientReferralDashboard.tsx` component.

## 2. Features

### 2.1. View Referral Details

- When a client opens a referral link, they are taken to the Client Referral Dashboard.
- The page fetches and displays the details of the referral, including:
    - Client's name
    - Service type
    - Estimated price
    - Deposit required
    - Any notes from the referring stylist.
- The page also shows the status of the referral (e.g., `pending`, `confirmed`).

### 2.2. View Referred Stylist

- The page prominently displays the stylist who was originally referred to the client.
- The stylist's card shows their name, photo, membership tier (Pro), rating, specialties, and price range.
- The client can view the stylist's full profile or book an appointment directly from this card.

### 2.3. View Alternative Stylists

- In addition to the referred stylist, the page also displays a list of other available professionals.
- This gives the client more options to choose from if the referred stylist is not a good fit.
- Each alternative stylist is displayed in a similar card format with their details.

### 2.4. Book an Appointment

- The client can book an appointment with either the referred stylist or one of the alternative stylists.
- Clicking the "Book Now" button initiates the booking process.
- For the demo, this simulates a deposit payment and confirms the booking.
- The status of the referral is then updated to `confirmed` in the database.

## 3. Data Model

The Client Referral feature interacts with the following tables in the Supabase database:

- `client_referral_links`: This table stores the unique tokens for client referral links and maps them to a `referral_id`.
- `referrals`: This table contains the core details of the referral.
- `users`: This table stores the profiles of the stylists.

## 4. User Interface

The user interface consists of:

- A header with the application name.
- A main content area that displays the appointment details, the referred stylist, and a list of alternative stylists.
- A section with the deposit and cancellation policy.
