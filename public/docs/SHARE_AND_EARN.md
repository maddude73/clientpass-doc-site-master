# Share and Earn

This document provides a detailed description of the Share and Earn feature.

## 1. Overview

The Share and Earn feature allows clients to earn rewards by sharing the ClientPass application with their friends. It is a key feature for driving user growth through word-of-mouth marketing.

The page is implemented in the `ShareAndEarnPage.tsx` page, which wraps the `ShareAndEarn.tsx` component.

## 2. Features

### 2.1. Unique Referral Link

- Each client is provided with a unique referral link.
- The link is generated and displayed on the page.
- The client can easily copy the link to their clipboard or share it directly through the web share API.

### 2.2. Earnings and Stats

- The page displays key statistics about the client's referral activity:
    - **Total Earned:** The total amount of commission the client has earned from their referrals.
    - **Total Referrals:** The total number of friends who have signed up using the client's link.

### 2.3. Earnings History

- The page displays a list of recent earnings from referrals.
- Each entry in the list shows:
    - The name of the referred client.
    - The status of the commission (e.g., `pending`, `completed`).
    - The service that was booked.
    - The date of the referral.
    - The amount of the commission earned.

### 2.4. How it Works

- The page includes a simple, three-step guide that explains how the Share and Earn feature works:
    1.  Share your link.
    2.  Your friend books and completes a service.
    3.  You earn a commission.

## 3. Data Model

The Share and Earn feature interacts with the following tables in the Supabase database:

- `client_profiles`: This table stores the unique `referral_link_token` for each client.
- `affiliate_commissions`: This table (or a similar one) would be used to track the commissions earned by clients from their referrals. The current implementation uses mock data.

## 4. User Interface

The user interface consists of:

- A header with a title and a description of the feature.
- A section with the client's earnings and referral stats.
- A section with the unique referral link and sharing buttons.
- A section with the client's recent earnings history.
- A section that explains how the feature works.
