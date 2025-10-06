---
id: 68dccbb8479feecff6266a96
revision: 10
---

# Sign Up Form

The `SignUpForm` component facilitates user registration within the application, allowing new users to create an account with various roles and configurations. The form has been updated to support new user types and referral mechanisms.

## Key Features

- **Referral Code Integration**: The form now checks for a `ref` query parameter in the URL to automatically associate new sign-ups with a referrer. It fetches and displays referrer information, personalizing the sign-up experience.
- **Expanded Role Selection**: Users can select from an expanded list of roles:
    - `Stylist`
    - `Barber`
    - `SuiteOwner`
    - `Affiliate Partner`
    - `Client Referrer`
- **Business Type Selection for Owners**: If a user selects `SuiteOwner`, they are prompted to specify their business type (Salon, Barbershop, or Suite).
- **Suite Professional Options**: Stylists and Barbers can indicate if they work in or own/manage a salon suite, which can influence their `role_tag` upon registration.
- **User Authentication**: Integrates with `useAuth` for user registration and `useToast` for feedback.

## Component Usage

The `SignUpForm` is typically used on an authentication page, allowing new users to create an account.

```tsx
import { SignUpForm } from '@/components/auth/SignUpForm';

const AuthPage = () => {
  const handleToggleMode = () => {
    // Logic to switch between sign-up and sign-in forms
    console.log('Toggle to sign-in');
  };

  return (
    <SignUpForm onToggleMode={handleToggleMode} />
  );
};
```

## Data Flow

1.  The form initializes by checking the URL for a referral code. If found, it fetches referrer details from Supabase.
2.  User inputs their full name, email, password, and selects their role.
3.  Based on the selected role, additional fields like business type or suite options may appear.
4.  Upon submission, the `handleSubmit` function calls the `signUp` method from `useAuth` with the collected user data, including the determined `role_tag` and `referralCode`.
5.  Success or error messages are displayed using `useToast`.
