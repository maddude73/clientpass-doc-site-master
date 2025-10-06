---
id: 68dccbb8479feecff6266a9a
revision: 14
---

# Stylist Profile Setup

The `StylistProfileSetup` component allows professionals to configure and manage their public profile, services, and commission settings. It is a central hub for professionals to present themselves to clients and other professionals within the platform.

## Key Features

- **Basic Information**: Professionals can update their full name, phone number, business location (address, city, state, ZIP code), and a professional bio.
- **Profile Photo Upload**: Users can upload a profile photo to personalize their profile.
- **Suite Tools Integration**: A prominent section allows salon suite owners to "Enable Suite Tools," which updates their profile role and redirects them to suite management features.
- **Service & Pricing Manager**: Integrates the `ServiceManager` component, allowing professionals to define and manage their service offerings and pricing.
- **Commission Settings**: Professionals can set their default commission rates for different scenarios:
    - **Referral Commission**: The percentage earned when referring a client to another professional.
    - **Coverage Commission**: The percentage earned when another professional covers their clients.
    - **Open Chair Commission**: The percentage earned as a chair provider when another professional works in their chair or suite.
- **Portfolio & Gallery (Coming Soon)**: A placeholder for future functionality to showcase their work.
- **Trusted Network**: Integrates the `TrustedNetwork` component, allowing professionals to manage their trusted connections.

## Component Usage

The `StylistProfileSetup` component is typically accessed by logged-in professionals to manage their profile.

```tsx
import { StylistProfileSetup } from '@/components/stylist/StylistProfileSetup';

const ProfilePage = () => {
  return (
    <StylistProfileSetup />
  );
};
```

## Data Flow

1.  On component mount, existing profile data is loaded from the `useAuth` context.
2.  Users can modify their basic information, upload a photo (simulated), and adjust commission settings.
3.  The "Enable Suite Tools" button triggers an `updateProfile` call to set `suite_owner` to `true` and `role_tag` to `suite_owner`.
4.  When the "Save Profile" button is clicked, the `handleSaveProfile` function updates the user's profile in the backend (via `updateProfile` from `useAuth`) with all the modified data, including the new commission percentages.
5.  Success or error messages are displayed using `useToast`.
