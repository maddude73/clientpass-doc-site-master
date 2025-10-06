---
id: 68dccbb7479feecff6266a86
revision: 14
---

# Integration Guide

## 1. Introduction

This document provides a guide for potential future integrations with the ClientPass platform. While ClientPass does not currently offer a public API, this document outlines the possible integration points and data exchange patterns that could be developed.

## 2. Authentication

Any external system integrating with ClientPass would require a secure method of authentication. The proposed method would be API Key-based authentication.

- **API Keys**: A unique, secret key would be generated for each integration partner. This key must be included in the `Authorization` header of all API requests.

## 3. Integration Patterns

Two primary patterns would be supported for integration: Webhooks for outbound data flow and a RESTful API for inbound data flow.

### 3.1 Webhooks (Outbound Data)

ClientPass could send real-time notifications to an external system when key events occur. The external system would need to provide a secure endpoint to receive these webhook payloads.

**Potential Webhook Events:**

- `referral.created`: Triggered when a new referral is initiated.
  - **Payload**: `{ referralId, senderId, clientInfo, serviceType, status }`
- `referral.accepted`: Triggered when a professional accepts a referral.
  - **Payload**: `{ referralId, receiverId, acceptedAt }`
- `referral.completed`: Triggered when a service is marked as complete.
  - **Payload**: `{ referralId, finalAmount, commission, fees }`
- `open_chair.posted`: Triggered when a new Open Chair is listed.
  - **Payload**: `{ openChairId, hostId, location, timeWindow, commissionPct }`
- `user.created`: Triggered when a new user successfully signs up.
  - **Payload**: `{ userId, fullName, role }`

### 3.2 REST API (Inbound Data)

A future RESTful API could allow external systems to create and manage resources within ClientPass.

**Hypothetical API Endpoints:**

- `POST /api/v1/referrals`
  - **Description**: Create a new referral for a walk-in client. This could be used by a salon's front-desk software to automatically refer overflow clients.
  - **Body**: `{ clientName, clientPhone, serviceType, commissionPct, notes }`

- `GET /api/v1/users/{userId}/earnings`
  - **Description**: Retrieve earnings data for a specific user.
  - **Response**: `{ total, pending, available, transactions: [...] }`

- `GET /api/v1/open_chairs`
  - **Description**: Get a list of currently available Open Chairs, filterable by location.
  - **Query Params**: `?zip_code=90210&radius=10`
  - **Response**: `[{ openChairId, hostName, location, ... }]`

## 4. Example Integration Use Case

**Scenario**: A third-party salon management software wants to integrate with ClientPass to handle overflow clients.

1.  **Setup**: The salon software company is issued an API key by ClientPass.
2.  **Workflow**:
    - A walk-in client arrives at the salon, but no stylists are available.
    - The front-desk staff uses their salon software to mark the client as an "overflow".
    - The salon software makes a `POST` request to `/api/v1/referrals` with the client's information.
    - ClientPass receives the request and initiates its internal referral workflow, finding an available stylist nearby.
3.  **Feedback Loop**: The salon software provides a webhook endpoint. When the referral is `completed`, ClientPass sends a `referral.completed` event to the webhook. The salon software can then use this data to update its own records, perhaps crediting the salon for the referral commission.
