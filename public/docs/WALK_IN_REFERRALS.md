---
id: 693f2168ed1c3d6b16d64ca5
revision: 1
---
# Walk-in Referrals

This document provides a detailed description of the Walk-in Referrals feature.

## 1. Overview

The Walk-in Referrals feature allows a stylist to manually record a referral that happened outside of the ClientPass application. This is useful for tracking referrals that come from word-of-mouth, phone calls, or clients who physically walk into the salon.

This feature is integrated into the `EnhancedReferralForm` component.

## 2. Features

### 2.1. Activation

-   The Walk-in Referral mode is activated by a "Walk-in" switch within the `EnhancedReferralForm`.
-   When the switch is toggled on, the form adapts to allow for the manual entry of referral information.

### 2.2. Contact Source

-   When recording a walk-in referral, the stylist can specify the `contact_source` of the referral.
-   The available options are:
    -   `Phone`
    -   `Text`
    -   `DM` (Direct Message)
    -   `WalkIn`

### 2.3. Manual Data Entry

-   The form allows the stylist to manually enter all the relevant details of the referral, including:
    -   Client's name
    -   Client's contact information
    -   The service requested
    -   The referred stylist

## 3. Use Case

The primary use case for this feature is to provide stylists with a way to track all their referrals, both digital and physical, in one central place. This ensures that they get credit for all the business they bring in, and it provides a more complete picture of their referral activity.

For example, if a regular client calls the stylist to refer a friend, the stylist can use the Walk-in Referral feature to record this referral in the ClientPass system.

## 4. Data Model

The Walk-in Referrals feature adds the `contact_source` field to the `referrals` table in the Supabase database. This field stores the source of the referral as specified by the stylist.