# Stylist Profile

This document provides a detailed description of the Stylist Profile feature.

## 1. Overview

The Stylist Profile page allows clients and other professionals to view a stylist's professional information, services, portfolio, and reviews. It serves as a digital resume and marketing tool for stylists on the ClientPass platform.

The page is implemented in the `StylistProfile.tsx` page, which wraps the `StylistProfile` component.

## 2. Key Features

### 2.1. Profile Header

-   **Stylist Information:** Displays the stylist's name, profile picture, and membership tier (e.g., "PRO").
-   **Availability Status:** Indicates if the stylist is currently available (e.g., "Available Now").
-   **Rating and Reviews:** Shows the average rating and the total number of reviews received.
-   **Location and Join Date:** Displays the stylist's business location and the year they joined ClientPass.
-   **Contact and Referral Options:** Buttons to "Contact" the stylist or "Send Referral" to them.

### 2.2. Services Offered

-   **Detailed Service List:** A comprehensive list of all services offered by the stylist, including:
    -   Service name and description.
    -   Price and estimated duration.
    -   Category (e.g., "Haircuts", "Coloring").

### 2.3. Portfolio

-   **Visual Showcase:** A gallery section to showcase the stylist's work through images. (Note: This feature is marked as "Coming Soon" in the setup page, but the profile page is designed to display it).

### 2.4. Reviews and Ratings

-   **Client Feedback:** Displays a list of reviews and ratings provided by clients.
-   **Detailed Reviews:** Each review includes the rating score, comments, and the date it was posted.
-   **Sentiment Analysis (Future Enhancement):** Could potentially integrate AI to summarize review sentiment.

## 3. Data Model

The Stylist Profile feature interacts with the following tables in the Supabase database:

-   `users`: Stores the stylist's basic profile information (name, photo, membership tier, location, etc.).
-   `ratings`: Stores the ratings and reviews given to the stylist.
-   `services`: Stores the services offered by the stylist.
-   `service_categories`: Stores the categories for the services.

## 4. User Interface

The Stylist Profile page features a clean and professional layout:

-   A header with the application name and "Stylist Profile" title.
-   A main content area organized into cards for Profile Header, Services, Portfolio, and Reviews.
