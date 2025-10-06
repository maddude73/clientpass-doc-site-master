# Pro Dashboard

This document provides a detailed description of the Pro Dashboard, the central hub for professional users (stylists, barbers) to manage their business on ClientPass.

## 1. Overview

The Pro Dashboard is designed to provide a comprehensive set of tools and information for professional users. It acts as a central navigation point, allowing stylists to access various functionalities related to client management, referrals, scheduling, earnings, and profile settings.

The dashboard is implemented in the `Dashboard.tsx` component, which dynamically renders different sub-pages based on the active tab selected by the user.

## 2. Key Features and Navigation

The Pro Dashboard is organized into several key sections, accessible via a bottom navigation bar and a settings icon in the header.

### 2.1. Home (HomePage.tsx)

-   **Summary of Activity:** Provides a quick overview of the day's key metrics, such as recent earnings, pending referrals, and upcoming appointments.
-   **Quick Actions:** Offers direct access to frequently used actions like sending a referral or posting an open chair.
-   **Dynamic Content:** This page likely integrates various cards or widgets that summarize information from other sections (e.g., a mini-view of referral timers, open chair status).

### 2.2. Schedule (SchedulePage.tsx)

-   **Calendar View:** Displays a calendar view of all upcoming and past appointments.
-   **Appointment Management:** Allows stylists to view appointment details, confirm, reschedule, or cancel appointments.
-   **Availability Management:** Provides tools for stylists to set and manage their availability.

### 2.3. Earnings (EarningsPage.tsx)

-   **Detailed Breakdown:** Offers a comprehensive breakdown of earnings from various sources, including services, referrals, and product sales.
-   **Payment Tracking:** Allows stylists to track their pending, available, and paid out earnings.
-   **Reporting:** Provides basic reporting features to analyze income over time.

### 2.4. Pro Hub (ProHubPage.tsx)

-   **Exclusive Resources:** A dedicated section for professional users to discover exclusive deals, educational resources, and industry news.
-   **Community Access:** May include links to professional forums or communities.

### 2.5. Inbox (InboxPage.tsx)

-   **Notification Center:** A centralized inbox for all notifications, including new referral requests, appointment confirmations, payment updates, and system alerts.
-   **Message Management:** Allows users to view, manage, and respond to messages.

### 2.6. Settings (SettingsPage.tsx)

-   **Profile Management:** Comprehensive settings for managing the stylist's profile, including personal information, contact details, and photo.
-   **Service Configuration:** Tools to add, edit, and delete services offered, along with pricing and duration.
-   **Commission Settings:** Configuration for referral and open chair commission rates.
-   **Account Settings:** General account management options, such as password changes and notification preferences.

## 3. User Interface

The Pro Dashboard features a clean and intuitive user interface:

-   **Header:** Contains the ClientPass logo and a quick-access settings icon.
-   **Main Content Area:** Dynamically displays the content of the selected sub-page.
-   **Bottom Navigation:** Provides easy access to the main sections of the dashboard (Home, Schedule, Earnings, Pro Hub, Inbox).

## 4. Benefits

-   **Centralized Management:** All essential tools and information are accessible from a single, intuitive interface.
-   **Increased Efficiency:** Streamlines daily operations, saving stylists time and effort.
-   **Enhanced Earnings:** Provides tools and insights to help stylists maximize their income.
-   **Improved Client Experience:** Facilitates better client management and communication.