# Frontend Component Guide

## 1. Introduction

This document provides an overview of the React component library used in the ClientPass application. Its purpose is to help developers understand, find, and reuse existing components, ensuring a consistent user interface and accelerating development.

## 2. Component Philosophy

The frontend follows a component-based architecture built on these principles:

- **Composition over Inheritance**: Complex components are built by composing simpler ones.
- **Reusability**: Components are designed to be reusable across different parts of the application.
- **Foundation**: The UI is built upon **shadcn-ui**, which provides unstyled, accessible base components (primitives).
- **Styling**: All components are styled using **Tailwind CSS** utility classes.

## 3. Component Directory Structure

- **`src/components/ui/`**: Contains the base UI primitives provided by `shadcn-ui` (e.g., `Button`, `Card`, `Input`). These are the fundamental building blocks of the interface.
- **`src/components/{feature}/`**: Contains custom components, specific to a particular feature or domain (e.g., `src/components/referrals/`). These are composed of base UI components and other feature components.

## 4. Base UI Components (`src/components/ui/`)

These are the foundational, unstyled components from `shadcn-ui`. Developers should prefer using these for any new UI element to maintain consistency. Key components include:

- `Button`: For all clickable actions.
- `Card`: The primary container for grouping related content.
- `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`: For all form elements.
- `Dialog`, `Sheet`: For modal and side-panel overlays.
- `Avatar`: For displaying user profile pictures.
- `Badge`: For status indicators and tags.
- `Toast` & `Sonner`: For displaying notifications.
- `Separator`: For visual dividers.

*For detailed API and usage, refer to the official shadcn-ui documentation.*

## 5. Key Feature Components

This section highlights some of the most important custom components, organized by feature.

### Authentication (`/auth`)
- **`LoginForm.tsx` / `SignUpForm.tsx`**: Standard forms for user sign-up and sign-in.
- **`AffiliateLoginForm.tsx` / `AffiliateSignUpForm.tsx`**: A separate set of forms for the affiliate portal, which uses a different authentication context.

### Referrals (`/referrals`)
- **`EnhancedReferralForm.tsx`**: A comprehensive form for creating a new walk-in referral. It includes logic for selecting services, setting commission, and defining client type.
- **`CountdownTimer.tsx`**: A critical UI component that displays a real-time countdown for pending referrals, indicating the time left for a professional to respond.
- **`ServiceCompletionForm.tsx`**: The form presented to a client to confirm a service was completed. It includes the required legal copy and an option to add a private tip.

### Open Chair (`/open-chair`)
- **`PostOpenChairForm.tsx`**: The form used by a Host to list their available chair. It includes fields for location, time window, allowed services, and host commission percentage.
- **`OpenChairAlerts.tsx`**: The main UI for stylists to browse and accept available Open Chair opportunities. It displays a list of available chairs and handles the acceptance workflow.
- **`LiveSessionCard.tsx`**: A dashboard component that appears when a stylist is in a live Open Chair session. It tracks services and calculates earnings in real-time.

### Auto-Matching & Networking (`/auto-match`)
- **`AutoMatchSystem.tsx`**: A feature that allows users to find available stylists based on filters like ZIP code, services, and availability.
- **`TrustedNetwork.tsx`**: A complete interface for managing a user's trusted partners, including adding new partners via search or email invite.
- **`AutoSuggestTrusted.tsx`**: A smart component that appears after a user has collaborated with another professional multiple times, suggesting they add them to their Trusted Network.

### Coverage Mode (`/coverage`)
- **`CoverageModePage.tsx`**: The main page for managing Coverage Mode. It allows a user to set their availability status and manage their list of backup professionals.
- **`CoveragePartnerList.tsx`**: A component for viewing, adding, and removing trusted professionals who will cover for the user when they are away.

### Other Key Components
- **`ClientPassLogo.tsx`**: A simple, reusable component for displaying the application's logo at various sizes.
- **`BottomNavigation.tsx`**: The primary navigation component for mobile views, providing access to the main sections of the app.
- **`EarningsCard.tsx`**: A dashboard widget that provides a summary of a user's pending, available, and total earnings.
- **`ServiceManager.tsx`**: A full CRUD interface for professionals to manage their personal list of services and prices.
