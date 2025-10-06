---
id: 68dccbb8479feecff6266a98
revision: 13
---

# Software Requirements Specification (SRS)

## 1. Introduction

### 1.1 Purpose

This document specifies the software requirements for **ClientPass**, a web-based platform designed to facilitate referrals, bookings, and collaboration among beauty professionals, including stylists, barbers, and salon suite owners. It serves as a comprehensive guide for development, testing, and project management.

### 1.2 Scope

The product is a responsive web application that provides the following core capabilities:
- A referral system for stylists to earn commission by sending clients to other professionals.
- A marketplace for temporary chair/suite rentals ("Open Chair").
- Tools for managing client bookings, availability, and earnings.
- A separate portal for affiliates to recruit users and earn commissions.
- Administrative dashboards for managing platform content and users.

### 1.3 Definitions

- **Pro/Professional**: A licensed stylist or barber using the platform.
- **Host**: A user (Pro or Suite Owner) offering their chair/space for temporary use.
- **Referral**: The act of sending a client to another professional for a service.
- **Open Chair**: A feature allowing a Host to list their available chair for a specific time window and commission rate.
- **Hot Seat**: A feature for posting a last-minute, often discounted, appointment slot to a targeted audience.
- **Coverage Mode**: A status that allows a Pro's clients to be automatically referred to other stylists when the Pro is unavailable.
- **Trusted Network**: A user-curated list of preferred professionals for sending/receiving referrals.

## 2. Overall Description

### 2.1 Product Perspective

ClientPass is a standalone, self-contained web application. It is built on a serverless architecture using Supabase for its backend, database, and authentication services. It does not depend on any other existing software systems.

### 2.2 Product Functions

The major functions of the system include:
1.  **User Management**: Separate sign-up, login, and profile management for standard users (Pros, Owners) and Affiliates.
2.  **Referral Workflow**: Creating, sending, accepting/declining, and tracking referrals with real-time countdown timers.
3.  **Open Chair Marketplace**: Posting, viewing, and accepting Open Chair sessions.
4.  **Live Session Management**: Real-time tracking of services and earnings during a live Open Chair session.
5.  **Hot Seat Alerts**: Creating and broadcasting last-minute appointment availability.
6.  **Coverage Mode Management**: Enabling/disabling coverage and managing a list of backup professionals.
7.  **Financial Tracking**: Dashboards for viewing pending, available, and total earnings from commissions.
8.  **Affiliate Portal**: Tools for affiliates to track their recruits and override commissions.
9.  **Admin Panels**: Interfaces for administrators to manage Pro Deals, export user data, and monitor system health.

### 2.3 User Characteristics

- **Stylist/Pro**: Tech-savvy but busy professionals who need a fast, mobile-friendly interface to manage referrals and fill their schedule.
- **Salon/Suite Owner**: Business owners who need tools to maximize the utilization of their space and track activity within their suite.
- **Affiliate**: Marketers or influencers who need tools to track their recruitment efforts and earnings.
- **Administrator**: Technical users responsible for platform maintenance, content management, and data analysis.

### 2.4 Constraints

- The application must be a responsive web app accessible on modern desktop and mobile browsers.
- The backend infrastructure is built exclusively on Supabase.
- All business logic must be contained within the React frontend or Supabase Edge Functions.
- Payment processing is handled via Stripe (simulated in the current build).

## 3. Specific Requirements

### 3.1 Functional Requirements

#### 3.1.1 User Authentication
- **REQ-101**: Users shall be able to sign up with an email and password.
- **REQ-102**: Users shall be able to select a role during sign-up (e.g., Stylist, Suite Owner, Affiliate).
- **REQ-103**: Affiliates shall use a separate authentication portal from standard users.
- **REQ-104**: Users shall be able to log in and log out.

#### 3.1.2 Referral Management
- **REQ-201**: A Pro shall be able to create a referral for a client, specifying the service, estimated price, and commission percentage (15-25%).
- **REQ-202**: The system shall find a suitable, available Pro to receive the referral, prioritizing the sender's Trusted Network.
- **REQ-203**: The receiving Pro shall be notified and have a 10-minute window to accept or decline.
- **REQ-204**: If a referral is declined or expires, the system shall automatically reassign it to the next available Pro.
- **REQ-205**: Upon completion of a referred service, the system shall calculate and record the commission for the sender.

#### 3.1.3 Open Chair
- **REQ-301**: A Host shall be able to post an Open Chair listing, specifying a location, time window, allowed services, and a host commission rate (15-25%).
- **REQ-302**: A Pro shall be able to view and accept an available Open Chair.
- **REQ-303**: Once a Pro accepts, they must check in to begin a "Live Session".
- **REQ-304**: During a Live Session, all services performed by the visiting Pro shall be tracked.
- **REQ-305**: Upon ending the session, the system shall calculate the host's commission from the total revenue and settle the earnings.

#### 3.1.4 Hot Seat
- **REQ-401**: A Pro shall be able to post a Hot Seat alert for a last-minute opening.
- **REQ-402**: The Hot Seat form shall allow specifying the service, price (original and discounted), time, and target audience (e.g., favorites, all local clients).
- **REQ-403**: The system shall send instant alerts to the selected audience.

#### 3.1.5 Profile & Network Management
- **REQ-501**: A Pro shall be able to set up their public profile, including a photo, bio, location, and list of services with prices.
- **REQ-502**: A Pro shall be able to add other professionals to their Trusted Network.
- **REQ-503**: After two completed collaborations, the system shall auto-suggest adding the other professional to the user's Trusted Network.

#### 3.1.6 Admin Panels
- **REQ-601**: The system shall provide a Master Admin Console accessible only to users with 'admin' or 'super_admin' roles.
- **REQ-602**: The Admin Console shall include a global dashboard displaying key metrics for users, revenue, and platform activity.
- **REQ-603**: Admins shall be able to manage feature flags, enabling or disabling features across the platform.
- **REQ-604**: Admins shall have a user management interface to view, search, and edit user profiles, including changing roles and membership tiers.
- **REQ-605**: Admins shall be able to manage business onboarding applications, with functionality to approve or deny them.
- **REQ-606**: Admins shall have access to a settings panel to configure platform-wide parameters like fees, commission rates, and feature limits.
- **REQ-607**: The console shall provide a monitoring tool for all referral, Open Chair, and Hot Seat activities.
- **REQ-608**: Admins shall be able to manage notification templates for all system-generated communications.
- **REQ-609**: The system shall provide a data export feature for admins to download datasets (e.g., users, payments) as CSV files.
- **REQ-610**: A comprehensive, searchable audit log shall record all actions performed by administrators.
- **REQ-911**: Admins shall have the ability to impersonate a user's account for support and troubleshooting purposes.

### 3.2 Non-Functional Requirements

- **PERF-01**: Referral notification and timer updates must appear in near real-time (< 5-second delay).
- **SEC-01**: All user data, especially PII and financial information, must be accessible only by authorized users, enforced by Supabase Row Level Security (RLS).
- **SEC-02**: Password storage and authentication must be handled securely by Supabase Auth.
- **USAB-01**: The user interface must be intuitive and optimized for mobile-first use.
- **REL-01**: The system should maintain high availability. Edge function failures should be logged and handled gracefully.

### 3.3 Interface Requirements

- **UI-01**: The application shall be a web-based graphical user interface (GUI) rendered in standard web browsers.
- **API-01**: The frontend shall communicate with the backend via the Supabase client library, which uses a combination of RESTful API calls (PostgREST) and WebSocket connections for real-time updates.
- **API-02**: Serverless Edge Functions shall be invoked via HTTPS requests from the client.
