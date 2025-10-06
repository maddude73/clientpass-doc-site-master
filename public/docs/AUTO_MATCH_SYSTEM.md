---
id: 68dccbb7479feecff6266a74
revision: 14
---

# Auto-Match System

The `AutoMatchSystem` component is a comprehensive feature that allows clients to find and connect with professionals based on a variety of criteria. It provides a user-friendly interface for clients to specify their needs and receive a list of suitable stylists or barbers.

## Key Features

- **Filtering**: Clients can filter professionals by:
    - **ZIP Code**: To find professionals in a specific area.
    - **Distance Radius**: To limit the search to a certain distance.
    - **Service Types**: To select specific services they are interested in.
    - **Availability**: To choose between professionals available "ASAP" or for future bookings.
- **Stylist Matching**: Based on the selected filters, the system searches for and displays a list of matching professionals.
- **Stylist Profiles**: The search results include key information about each professional, such as their name, location, rating, review count, distance, and available services.
- **Trusted Network**: The component also includes a `TrustedNetwork` feature, allowing users to connect with professionals within their trusted circle.
- **User Preferences**: The system can load and save user preferences for a more personalized experience.

## Component Usage

The `AutoMatchSystem` component is designed to be a central part of the client's booking journey. It is typically displayed when a client is looking to find a new professional.

```tsx
import { AutoMatchSystem } from '@/components/auto-match/AutoMatchSystem';

const MyPage = () => {
  return (
    <AutoMatchSystem onBack={() => console.log('Back to dashboard')} />
  );
};
```

## Data Flow

1.  The component loads user preferences and available services on mount.
2.  The user sets their desired filters (ZIP code, distance, services, availability).
3.  When the user clicks "Search Pros", the `searchStylists` function is called.
4.  This function queries the backend (or the `demoMatching` service in demo mode) to find professionals that match the criteria.
5.  The results are displayed to the user, sorted by rating and availability.
6.  The user can then view the profile of a professional or select them for a referral.
