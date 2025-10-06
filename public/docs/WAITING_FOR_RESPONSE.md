# Waiting for Response Page

This document provides a detailed description of the Waiting for Response page.

## 1. Overview

The Waiting for Response page is displayed to a user (typically a sender of a referral) after they have successfully sent a referral to a professional. This page provides real-time updates on the status of the referral and informs the sender about the next steps.

The page is implemented in the `WaitingForResponse.tsx` component.

## 2. Key Features

### 2.1. Real-time Status Updates

-   **Supabase Real-time Subscriptions:** The page uses Supabase real-time subscriptions to listen for updates to the referral status in the database.
-   **Dynamic Content:** The content and messages displayed on the page dynamically change based on the referral's status (e.g., `waiting`, `accepted`, `declined`, `expired`).

### 2.2. Countdown Timer

-   **Response Deadline:** A `CountdownTimer` component is prominently displayed, showing the remaining time for the referred professional to respond to the referral.
-   **Automatic Reassignment:** If the timer expires without a response, the referral is automatically reassigned to another available professional.

### 2.3. Referral Details

-   **Summary:** Displays a summary of the referral details, including the client's name, service type, the professional it was sent to, and potential earnings.

### 2.4. Status Messages

-   **Informative Messages:** Provides clear and concise messages to the sender about the current status of their referral.
    -   **Waiting:** "Referral sent successfully. Waiting for stylist to accept."
    -   **Accepted:** "Great news! [Professional Name] has accepted the referral. Connecting with client..."
    -   **Expired:** "No response received. We're now looking for another available professional in your network."

### 2.5. Referral Complete Screen

-   **Confirmation:** If the referral is accepted and completed, the page transitions to a `ReferralComplete` screen, providing a final confirmation and summary.

## 3. Data Model

The Waiting for Response page interacts with the `referrals` and `users` tables in the Supabase database to fetch and monitor referral status.

## 4. User Interface

The user interface consists of:

-   A header with a back button and a "Waiting for Response" title.
-   A main content area that dynamically displays the referral status, countdown timer, and referral details.
-   Status badges that indicate the type of referral (e.g., "Walk-In Referral", "Coverage Mode", "Auto-Match").
