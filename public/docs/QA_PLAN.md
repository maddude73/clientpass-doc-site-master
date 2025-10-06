---
id: 68dccbb8479feecff6266a8e
revision: 10
---

# Quality Assurance (QA) Plan

## 1. Introduction

### 1.1 Purpose

This document outlines the Quality Assurance (QA) strategy for the ClientPass application. Its purpose is to define the scope of testing, methodologies, resources, and schedule to ensure the final product is reliable, functional, and meets the requirements specified in the Software Requirements Specification (SRS).

### 1.2 Scope

This QA plan covers all aspects of the ClientPass web application, including:
- **Functional Testing**: Verifying all features work as designed.
- **UI/UX & Usability Testing**: Ensuring the application is intuitive and easy to use.
- **Performance Testing**: Checking for responsiveness and speed, especially in real-time features.
- **Security Testing**: Validating data protection and access control.

## 2. Testing Strategy

### 2.1 Levels of Testing

1.  **Unit Testing**: Developers are responsible for writing unit tests for individual components, utility functions, and Supabase Edge Functions. The goal is to ensure each isolated part works correctly.
    - *Tools*: Jest, React Testing Library.

2.  **Integration Testing**: This phase focuses on testing the interactions between different parts of the application, such as:
    - Frontend components interacting with React Contexts.
    - Client-side forms submitting data to Supabase Edge Functions.
    - Interactions between different Edge Functions.

3.  **System (End-to-End) Testing**: E2E tests will simulate full user journeys to validate complete workflows from the user's perspective.
    - *Tools*: Cypress or Playwright.

4.  **User Acceptance Testing (UAT)**: A final phase where stakeholders or a sample group of target users (stylists, suite owners) test the application to confirm it meets their business needs.

### 2.2 Types of Testing

- **Functional Testing**: Validating the specific requirements outlined in the SRS.
- **Usability Testing**: Ensuring the application is user-friendly, especially on mobile devices.
- **Compatibility Testing**: Verifying the application works correctly on major web browsers (Chrome, Firefox, Safari).
- **Security Testing**: Includes checks for proper data access control via Supabase RLS and secure handling of authentication tokens.

## 3. Test Environment

- **Local Development**: Developers will run tests locally using `npm run dev` and `npm run test`.
- **Staging Environment**: A dedicated Supabase project and Vercel/Netlify deployment will be used for pre-production testing to mirror the production environment as closely as possible.

## 4. Test Scenarios

This section outlines high-level test cases for the core features of ClientPass.

### 4.1 User Authentication & Roles
- **TC-AUTH-01**: Verify a new user can sign up as a "Stylist" and log in.
- **TC-AUTH-02**: Verify a new user can sign up as a "Suite Owner" and sees the Suite Tools on their dashboard.
- **TC-AUTH-03**: Verify a user signing up via the `/affiliate-auth` route is created as an affiliate and sees the affiliate dashboard.
- **TC-AUTH-04**: Verify that a non-admin user cannot access admin-only pages or data.

### 4.2 Referral Workflow
- **TC-REF-01**: A Pro sends a referral. Verify the receiving Pro gets a notification with a 10-minute countdown timer.
- **TC-REF-02**: A receiver accepts a referral within 10 minutes. Verify the referral status updates to `accepted` and the sender is notified.
- **TC-REF-03**: A receiver declines a referral. Verify the system reassigns it to the next available Pro.
- **TC-REF-04**: A referral timer expires. Verify the system automatically reassigns it.
- **TC-REF-05**: After a service is marked `completed`, verify the commission is calculated correctly based on the service price and commission percentage.

### 4.3 Open Chair & Live Sessions
- **TC-OC-01**: A Host posts an Open Chair. Verify the listing is visible to other Pros in the correct audience group ('trusted' or 'all').
- **TC-OC-02**: A Pro accepts an Open Chair. Verify the host is notified and the chair's status becomes `accepted`.
- **TC-OC-03**: The accepting Pro checks in. Verify the session status changes to `live` and the Live Session Card appears on their dashboard.
- **TC-OC-04**: During a live session, log a service with a manual payment. Verify the host's commission is calculated correctly, accounting for the manual payment surcharge.
- **TC-OC-05**: End a session. Verify all earnings are settled and the session is marked `completed`.

### 4.4 Commissions & Fees
- **TC-FEE-01**: Test with a service price < $100. Verify the platform fee is $3 for Free members and $2 for Pro members.
- **TC-FEE-02**: Test with a service price >= $100. Verify the platform fee is $5 for Free members and $3 for Pro members.
- **TC-FEE-03**: Test an Open Chair booking with an outside referrer. Verify the referrer earns 10% of the service price, and this amount is deducted from the host's share, not the stylist's earnings.

### 4.5 Profile & Network
- **TC-NET-01**: Add a user to the Trusted Network. Verify they appear in the list.
- **TC-NET-02**: Send a referral with the "Trusted Network first" option. Verify the referral is only sent to trusted partners initially.
- **TC-NET-03**: Simulate two completed co-ops between users. Verify the system prompts to add the other user to the Trusted Network.

### 4.6 Admin Console
- **TC-ADMIN-01**: Log in as an admin. Verify the Master Admin Console is visible and all modules are accessible.
- **TC-ADMIN-02**: Log in as a non-admin user. Verify that navigating to `/admin` redirects to the main dashboard and shows an "Access Denied" error.
- **TC-ADMIN-03**: In the User Management module, change a user's role from 'member' to 'admin'. Verify the user can now access the admin console.
- **TC-ADMIN-04**: In the Feature Flags module, disable a feature (e.g., "Hot Seat"). Verify the Hot Seat button/form is no longer visible to regular users.
- **TC-ADMIN-05**: In the Platform Settings module, change the platform fee percentage. Verify that new referrals use the updated fee in their commission calculations.
- **TC-ADMIN-06**: In the Data Export module, export the 'users' dataset. Verify a CSV file is downloaded with the correct user data.
- **TC-ADMIN-07**: Perform an administrative action (e.g., approve a business application). Verify the action is recorded correctly in the Audit Log module.
- **TC-ADMIN-08**: Use the impersonation feature to view the app as a regular user. Verify the admin banner is present and that admin-level access is disabled during impersonation.

## 5. Bug Reporting

- All bugs will be tracked in a designated issue tracker (e.g., GitHub Issues).
- Each bug report must include:
  - A clear, descriptive title.
  - Steps to reproduce the bug.
  - Expected result vs. Actual result.
  - Screenshots or video recordings.
  - Severity level (e.g., Blocker, Critical, Major, Minor).
