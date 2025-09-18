# Sequence Diagrams

This document provides detailed sequence diagrams for key workflows within the ClientPass application. These diagrams illustrate the dynamic interactions between different parts of the system.

---

## 1. Accepting a Referral (Happy Path)

This diagram shows the process when a stylist successfully accepts a referral notification within the time limit.

```mermaid
sequenceDiagram
    actor Pro
    participant Frontend
    participant Supabase as Backend
    participant SenderFrontend as Sender's App

    Pro->>Frontend: Clicks "Accept" on a referral notification
    Frontend->>Supabase: Invokes `inbox-action` Edge Function with { referralId, action: 'accept' }
    activate Supabase

    Supabase->>Supabase: Verifies referral is still 'pending' and not expired
    Supabase->>Supabase: Updates `referrals` table status to 'accepted'
    Supabase->>Supabase: Creates notification for sender in `messages` table
    Supabase-->>Frontend: Returns success response
    deactivate Supabase

    Frontend->>Pro: Shows "Accepted!" confirmation UI

    Note over Supabase, SenderFrontend: Supabase sends real-time event
    Supabase->>SenderFrontend: Real-time message for 'referral.accepted'
    SenderFrontend->>SenderFrontend: Updates UI to show referral was accepted
```

---

## 2. Handling an Expired Referral

This diagram illustrates the automated backend process when a referral is not accepted in time.

```mermaid
sequenceDiagram
    actor Scheduler
    participant CronJob as Cron Job (referral-timer)
    participant Supabase as Backend
    participant NextProFrontend as Next Pro's App

    Scheduler->>CronJob: Triggers every minute
    activate CronJob
    CronJob->>Supabase: Queries for `referrals` where `status` is 'pending' AND `expires_at` < now()
    activate Supabase
    Supabase-->>CronJob: Returns list of expired referrals
    deactivate Supabase

    loop For each expired referral
        CronJob->>Supabase: Invokes `reassign-referral` Edge Function
        activate Supabase
        Supabase->>Supabase: Finds next best available Pro, excluding previous receivers
        alt Next Pro Found
            Supabase->>Supabase: Updates `referrals` record with new `receiver_id` and new `expires_at`
            Supabase->>Supabase: Creates notification for the new Pro in `messages` table
            Supabase->>NextProFrontend: (Later) Sends real-time notification
        else No Pro Found
            Supabase->>Supabase: Updates `referrals` status to 'expired'
            Supabase->>Supabase: Notifies original sender that no one was found
        end
        deactivate Supabase
    end
    deactivate CronJob
```

---

## 3. Open Chair Session Workflow

This diagram shows the end-to-end flow of a stylist using an Open Chair, from check-in to settlement.

```mermaid
sequenceDiagram
    actor Pro
    participant Frontend
    participant Supabase as Backend

    Pro->>Frontend: Clicks "Check In" for an accepted Open Chair
    Frontend->>Supabase: Invokes `check-in-open-chair` Edge Function
    activate Supabase
    Supabase->>Supabase: Updates `open_chairs` status to 'live'
    Supabase-->>Frontend: Returns success
    deactivate Supabase
    Frontend->>Pro: Displays "Live Session" dashboard

    Note over Pro, Backend: During the session, the Pro performs services...

    Pro->>Frontend: Logs a completed service (e.g., via a button in the Live Session UI)
    Frontend->>Supabase: Updates a `referrals` record status to 'completed' and sets `open_chair_id`

    Note over Pro, Backend: At the end of the day...

    Pro->>Frontend: Clicks "End Session"
    Frontend->>Supabase: Invokes `end-open-chair-session` Edge Function
    activate Supabase
    Supabase->>Supabase: Updates `open_chairs` status to 'completed'
    Supabase->>Supabase: Fetches all associated `referrals` marked as completed during the session
    loop For each completed service
        Supabase->>Supabase: Invokes `settle-open-chair-commission` function
        activate Supabase
        Supabase->>Supabase: Calculates platform fee, host share, and stylist net
        Supabase->>Supabase: Inserts records into `commissions` table for host and stylist
        deactivate Supabase
    end
    Supabase-->>Frontend: Returns success
    deactivate Supabase
    Frontend->>Pro: Shows session summary and total earnings
```
