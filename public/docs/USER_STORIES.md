---
id: 693f2168f1786fb0fe54d51d
revision: 1
---
# User Story Backlog

**Last Updated**: November 8, 2025

This document contains the user story backlog for the ClientPass application, organized by feature epics.

---

## Epic: User Authentication & Onboarding

- **Story**: As a stylist, I want to sign up with my email and password so I can create an account and access the platform.
- **Story**: As a new user, I want a simple onboarding process that guides me through setting up my profile and services so I can start receiving referrals quickly.
- **Story**: As an affiliate, I want to sign up through a dedicated affiliate portal so I can join the affiliate program.
- **Story**: As a user, I want to be able to log in securely and log out of my account.

## Epic: Referral Management

- **Story**: As a busy stylist, I want to quickly send a walk-in client I can't serve to another available stylist so I can earn a referral commission.
- **Story**: As a stylist, I want to receive real-time notifications for new referrals so I don't miss out on potential clients.
- **Story**: As a receiving stylist, I want a 10-minute exclusive window to accept or decline a referral so I have time to check my schedule without pressure.
- **Story**: As a sender, I want the system to automatically reassign an expired or declined referral to the next best stylist so the client still gets served.
- **Story**: As a user, I want to track the status of referrals I've sent and received (pending, accepted, completed) so I know what's happening.
- **Story**: As a stylist, I want to modify the services on a referral after creation if the client's needs change.
- **Story**: As a stylist, I want to adjust the price of a referral if additional services are needed.
- **Story**: As a client, I want to request adding services to my existing appointment without creating a new booking.
- **Story**: As a user, I want minor adjustments (under $20 or 15 minutes) to be approved automatically.
- **Story**: As a user, I want to see how adjustments will affect the total price and commission before submitting.
- **Story**: As a stylist, I want to provide a reason when requesting an adjustment so the client understands the change.
- **Story**: As a client, I want to be notified when an adjustment is requested and have the option to approve or decline.
- **Story**: As an admin, I want to review the audit trail of all referral adjustments for dispute resolution.
- **Story**: As a user, I want to see a before/after comparison when an adjustment is proposed.
- **Story**: As a stylist, I want adjustments that require approval to be processed quickly without long delays.
- **Story**: As a stylist, I want to use an enhanced referral form that provides more options and flexibility for service selection.
- **Story**: As a stylist, I want to adjust service details for referral-based bookings with an audit trail for transparency.

## Epic: Open Chair Marketplace

- **Story**: As a salon owner with empty stations, I want to post my available chairs with a commission rate so I can monetize unused space.
- **Story**: As a traveling stylist, I want to find and book a temporary chair in a new city so I can serve my clients on the go.
- **Story**: As a stylist accepting an Open Chair, I want to "check in" to start a live session to begin tracking my services.
- **Story**: As a host, I want to see a real-time summary of services and revenue generated during a live session so I can track my earnings.
- **Story**: As a host, I want commissions to be calculated and settled automatically when a session ends.

## Epic: Hot Seat (Flash Sales)

- **Story**: As a stylist with a last-minute cancellation, I want to post a "Hot Seat" deal with a discount to fill the empty slot quickly.
- **Story**: As a stylist, I want to broadcast Hot Seat alerts to specific audiences (my favorites, all my clients, or all local users) to maximize visibility.
- **Story**: As a client, I want to be notified of Hot Seat deals from my favorite stylists so I can book a service at a discount.

## Epic: Coverage Mode

- **Story**: As a stylist planning a vacation, I want to enable "Coverage Mode" so my incoming client requests are automatically forwarded to trusted colleagues.
- **Story**: As a stylist, I want to build a "Coverage List" of specific professionals I trust to handle my clients when I'm away.
- **Story**: As a covering stylist, I want to receive referral notifications for clients of the unavailable stylist so I can earn extra income.
- **Story**: As a stylist, I want to manage my trusted network easily through the settings page.
- **Story**: As a stylist, I want the coverage mode to redirect me to manage my trusted network if no matches are found.

## Epic: Financials & Earnings

- **Story**: As a user, I want a clear dashboard showing my total earnings, pending payments, and available payout balance.
- **Story**: As a user, I want to securely connect my Stripe account to receive automatic weekly or monthly payouts.
- **Story**: As a user, I want to view a detailed transaction history for all my completed referrals and sessions.

## Epic: Profile & Network Management

- **Story**: As a stylist, I want to create a rich public profile with my photo, bio, services, prices, and portfolio to attract new clients.
- **Story**: As a user, I want to add a professional I've worked with to my "Trusted Network" to prioritize them for future referrals.
- **Story**: As a user, I want the app to suggest adding a professional to my Trusted Network after we have successfully collaborated multiple times.

## Epic: Affiliate Program

- **Story**: As an affiliate, I want a unique referral link to share with stylists so I can get credit for recruiting them.
- **Story**: As an affiliate, I want to see a dashboard of my total sign-ups and the commissions I've earned from their activity.
- **Story**: As an affiliate manager, I want to approve or deny pending affiliate applications.

## Epic: Administration

- **Story**: As an admin, I want a global dashboard to get a high-level overview of user activity, revenue, and system health.
- **Story**: As an admin, I want to manage feature flags to enable or disable specific platform features in real-time.
- **Story**: As an admin, I want to manage all users, view their profiles, and change their roles or status (active/inactive).
- **Story**: As an admin, I want to view and manage all business onboarding applications, with the ability to approve or deny them.
- **Story**: As an admin, I want to configure platform-wide settings, such as pricing, fees, and commission rates.
- **Story**: As an admin, I want to monitor all referral activity across the platform to identify trends and potential issues.
- **Story**: As an admin, I want to manage "Open Chair" and "Hot Seat" postings, with the ability to close or modify them.
- **Story**: As an admin, I want to manage all notification templates (email, SMS, push) sent by the system.
- **Story**: As an admin, I want to export various datasets (users, referrals, payments) in CSV format for external analysis.
- **Story**: As an admin, I want to view a detailed audit log of all administrative actions to ensure accountability and security.
- **Story**: As an admin, I want to impersonate a user to view the platform from their perspective for troubleshooting and support.
- **Story**: As an admin, I want a dashboard to manage "Pro Deals" that are available to all platform users.
- **Story**: As an admin, I want to view a system health dashboard to monitor platform activity.

## Epic: AI-Assisted Features

- **Story**: As an admin, I want to configure which AI provider (Google, OpenAI, Anthropic, Ollama) the platform uses without restarting the application.
- **Story**: As an admin, I want to customize system prompts for different AI use cases to optimize results.
- **Story**: As an admin, I want to monitor AI usage metrics including tokens consumed, costs, and response times.
- **Story**: As a stylist, I want the matching system to consider my specialties and the client's needs when suggesting referrals.
- **Story**: As a client, I want personalized service recommendations based on my booking history and preferences.
- **Story**: As a stylist, I want the system to automatically summarize my reviews to highlight my strengths.
- **Story**: As a new stylist, I want help generating a professional bio for my profile using AI assistance.
- **Story**: As a client, I want to book appointments using natural language (e.g., "I need a haircut next Tuesday afternoon").
- **Story**: As a stylist, I want AI to suggest products from the affiliate marketplace that match the services I provide.
- **Story**: As an admin, I want to test different AI providers with sample prompts before switching production traffic.

## Epic: Service Catalog Management

- **Story**: As an admin, I want to create and maintain a global catalog of standardized services available on the platform.
- **Story**: As an admin, I want to organize services using a hierarchical taxonomy (Categories → Subcategories → Service Types).
- **Story**: As an admin, I want to set typical price ranges and durations for catalog services to guide professionals.
- **Story**: As a stylist, I want to select services from a pre-defined catalog rather than creating custom services from scratch.
- **Story**: As a stylist, I want to browse services by category when setting up my profile to find relevant offerings.
- **Story**: As a client, I want an intuitive category-based interface for selecting services when booking.
- **Story**: As a client, I want to see typical pricing and duration when selecting services.
- **Story**: As an admin, I want to bulk-update multiple services at once for efficient catalog management.
- **Story**: As an admin, I want to deactivate services that are no longer offered without deleting historical data.
- **Story**: As a stylist, I want my service prices to auto-populate from the catalog but allow customization if needed.

## Epic: Quick Rebook System

- **Story**: As a repeat client, I want to rebook my last appointment with one click from my booking history.
- **Story**: As a client, I want the rebook form to pre-fill with my previous stylist, services, and location.
- **Story**: As a client, I want AI to suggest optimal time slots based on my past booking patterns.
- **Story**: As a client, I want to modify the services during rebooking if I want something different this time.
- **Story**: As a stylist, I want to receive rebook requests in a dedicated interface where I can quickly accept or decline.
- **Story**: As a stylist, I want to propose alternative times if my client's requested slot is unavailable.
- **Story**: As a client, I want to see my complete booking history so I can easily find appointments to rebook.
- **Story**: As a client, I want to set default preferences for rebooking (preferred times, services) to make it even faster.
- **Story**: As a stylist, I want to prioritize rebook requests from repeat clients to build loyalty.
- **Story**: As an admin, I want to track rebook rates to measure client retention and stylist loyalty.
- **Story**: As a stylist, I want a quick rebook feature to appear after service completion to encourage repeat bookings.
- **Story**: As a stylist, I want a booking drawer that allows for a full booking experience with quick rebook options.