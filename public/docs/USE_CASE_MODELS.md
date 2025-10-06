---
id: 68dccbb8479feecff6266aa2
revision: 10
---

<!-- TODO: Fix Mermaid diagram rendering issue in Section 4. The diagrams are not rendering correctly, and this is a known issue. -->

# Use Case Models

## 1. Introduction

This document describes the primary use cases for the ClientPass system, detailing the interactions between users (actors) and the system to achieve specific goals.

## 2. Actors

- **Pro (Stylist/Barber)**: A professional providing services.
- **Host**: A Pro or Suite Owner who lists their chair/space for use.
- **Client**: A person receiving a service, referred via the platform.
- **Affiliate**: A user who recruits other Pros to the platform.
- **Admin**: A system administrator.

## 3. Use Case Diagram

```mermaid
graph TD
    subgraph "ClientPass System"
        UC1((Send Walk-in Referral))
        UC2((Accept a Referral))
        UC3((Post an Open Chair))
        UC4((Book an Open Chair))
        UC5((Post a Hot Seat))
        UC6((Join as Affiliate))
        UC7((Manage Pro Deals))
    end

    Pro["Pro"]
    Host["Host"]
    Affiliate["Affiliate"]
    Admin["Admin"]

    Pro --> UC1
    Pro --> UC2
    Pro --> UC4
    Pro --> UC5
    Host --> UC3
    Affiliate --> UC6
    Admin --> UC7
```

## 4. Use Case Descriptions

### UC-01: Send a Walk-in Referral

```mermaid
graph TD
    A(Pro) --> B((Send Walk-in Referral))
```

**Use Case ID**: UC-01

**Actor**: Pro

**Description**: A Pro sends a client they cannot serve to another available professional in the network to earn a commission.

**Preconditions**:<br>- The Pro is logged in.<br>- The Pro has clients who need services.

**Success Criteria**:<br>- A new `referrals` record is created in the database with a `pending` status, containing all referral data (client info, service, commission).<br>- The system correctly identifies and assigns the referral to the best-matched available Pro based on the sender's trusted network and Pro availability.<br>- The receiving Pro is sent a real-time notification (e.g., push notification, SMS) within 5 seconds of the referral being sent.<br>- The sending Pro's UI updates to show the referral as 'pending' and which Pro it was sent to.<br>- The referral is correctly associated with the sender's and receiver's accounts for future tracking.

### UC-02: Accept a Referral

```mermaid
graph TD
    A(Pro) --> B((Accept a Referral))
```

**Use Case ID**: UC-02

**Actor**: Pro

**Description**: A Pro accepts a referral request sent to them.

**Preconditions**:<br>- The Pro is logged in.<br>- A referral with a `pending` status has been assigned to the Pro.

**Success Criteria**:<br>- The `referrals` record status is updated from `pending` to `accepted` in the database.<br>- The `accepted_at` timestamp is recorded, and the `expires_at` timer is cleared.<br>- The original sender is notified in real-time (e.g., push notification, UI update) that their referral was accepted.<br>- The client's contact information (full name and phone number) is made visible to the accepting Pro.<br>- The accepting Pro's UI updates to show the accepted referral and the client's contact details.

### UC-03: Post an Open Chair

```mermaid
graph TD
    A(Host) --> B((Post an Open Chair))
```

**Use Case ID**: UC-03

**Actor**: Host

**Description**: A Host lists their available chair or workspace for other professionals to use.

**Preconditions**:<br>- The Host is logged in and has a `pro` or `suiteOwner` role.<br>- The Host has an available chair to list.

**Success Criteria**:<br>- A new record is created in the `open_chairs` table with an `open` status and all listing details (location, time, commission, etc.).<br>- The listing is immediately visible to other Pros in the specified audience group (e.g., trusted network, all).<br>- The system sends notifications (e.g., push, email) to eligible Pros about the new opportunity, based on their location and notification preferences.<br>- The Host's UI updates to show their new active listing.

### UC-04: Book an Open Chair

```mermaid
graph TD
    A(Pro) --> B((Book an Open Chair))
```

**Use Case ID**: UC-04

**Actor**: Pro

**Description**: A Pro books an available Open Chair to serve their clients.

**Preconditions**:<br>- The Pro is logged in.<br>- There is an `open_chairs` listing with an `open` status.

**Success Criteria**:<br>- The Pro can successfully accept the open chair, creating a temporary 10-minute lock on the listing.<br>- The Pro can confirm the booking within the 10-minute window, updating the `open_chairs` status to `accepted`.
- The Host is notified in real-time of the confirmed booking.<br>- The Pro can successfully "check in" to start a `live` session, changing the status to `live`.
- At the end of the session, all services rendered are correctly tracked, and commissions are calculated and distributed to the Host and the Pro.<br>- The Pro's and Host's earnings dashboards are updated with the correct amounts.

### UC-05: Post a Hot Seat

```mermaid
graph TD
    A(Pro) --> B((Post a Hot Seat))
```

**Use Case ID**: UC-05

**Actor**: Pro

**Description**: A Pro advertises a last-minute appointment opening, often at a discount.

**Preconditions**:<br>- The Pro is logged in.<br>- The Pro has a last-minute opening in their schedule.

**Success Criteria**:<br>- A new `hot_seats` record is created in the database with all the offer details.<br>- Notifications are successfully dispatched in real-time to the audience selected by the Pro (e.g., favorites, all clients).<br>- A client can claim the hot seat, which updates its status to `claimed` and prevents others from claiming it.<br>- The Pro is notified when a client claims the hot seat.<br>- The client receives a confirmation of their claimed hot seat.
