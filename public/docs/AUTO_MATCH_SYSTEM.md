---
id: 693f2168ff7ca9327113f44a
revision: 1
---
# Auto-Match System

This document provides a detailed description of the Auto-Match System feature.

## 1. Overview

The `AutoMatchSystem` is a comprehensive feature that allows clients to find and connect with professionals based on a variety of criteria. It provides a user-friendly interface for clients to specify their needs and receive a list of suitable stylists or barbers.

The feature is implemented in the `AutoMatchSystem.tsx` component.

## 2. Features

### 2.1. Advanced Filtering

Clients can filter professionals by a combination of criteria to find the perfect match:

-   **Location:**
    -   **ZIP Code:** To find professionals in a specific area.
    -   **Distance Radius:** To limit the search to a certain distance from the specified ZIP code.
-   **Services:**
    -   Clients can select one or more specific services they are interested in (e.g., Haircut, Coloring, Beard Trim).
-   **Availability:**
    -   **ASAP (Hot Seat):** For clients who need a service immediately. This prioritizes stylists who have marked themselves as available for last-minute bookings.
    -   **Future Booking:** For clients who want to schedule an appointment in advance.

### 2.2. Stylist Matching Algorithm

-   Based on the selected filters, the system queries the database to find professionals who match the criteria.
-   The matching algorithm considers the following factors:
    -   **Location:** The stylist's ZIP code must be within the specified distance radius.
    -   **Services:** The stylist must offer all the selected services.
    -   **Availability:** The stylist's availability must match the client's selection (ASAP or future).
-   The search results are sorted by the stylist's rating and their availability.

### 2.3. Stylist Profiles

The search results are displayed as a list of stylist profile cards. Each card includes the following key information:

-   Stylist's name and profile picture.
-   Location (city and state).
-   Average rating and number of reviews.
-   Distance from the client's specified location.
-   A list of available services.
-   A "Request a Pro" button to initiate a booking request.

### 2.4. Trusted Network

-   The `AutoMatchSystem` also includes a `TrustedNetwork` feature.
-   This allows users to build a network of trusted professionals.
-   When searching for a stylist, clients can choose to search within their trusted network first.

### 2.5. User Preferences

-   The system can load and save user preferences (e.g., default ZIP code, distance radius).
-   This provides a more personalized and convenient experience for returning users.

## 3. Data Flow

1.  The component loads user preferences and available services on mount.
2.  The user sets their desired filters (ZIP code, distance, services, availability).
3.  When the user clicks "Search Pros", the `searchStylists` function is called.
4.  This function queries the backend (or the `demoMatching` service in demo mode) to find professionals that match the criteria.
5.  The results are displayed to the user, sorted by rating and availability.
6.  The user can then view the profile of a professional or click "Request a Pro" to send a booking request.

## 4. Component Usage

The `AutoMatchSystem` component is designed to be a central part of the client's booking journey.

```tsx
import { AutoMatchSystem } from '@/components/auto-match/AutoMatchSystem';

const MyPage = () => {
  return (
    <AutoMatchSystem onBack={() => console.log('Back to dashboard')} />
  );
};
```

## 5. AI Enhancement Opportunities

The Auto-Match System is a prime candidate for enhancement with Artificial Intelligence (AI) and Large Language Models (LLMs). An AI-powered matching system could provide more intelligent and personalized recommendations to clients.

For a detailed breakdown of the AI opportunities for this feature, please refer to the **[AI Opportunities](./AI_OPPORTUNITIES.md)** document.

Key AI enhancement ideas include:

-   **Semantic Search:** Instead of just matching keywords, an AI-powered system could understand the semantic meaning of a client's request (e.g., "a stylist who is good with curly hair and can do a modern balayage").
-   **Image-Based Matching:** Clients could upload inspiration photos, and the system could use image analysis to find stylists with similar work in their portfolios.
-   **Personalized Rankings:** The system could learn a client's preferences over time and rank the search results based on their individual style and booking history.