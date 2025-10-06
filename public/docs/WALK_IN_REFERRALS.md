---
id: 68dccbb8479feecff6266aa4
revision: 14
---

# Walk-In Referral Form

The `WalkInReferralForm` is a powerful tool for professionals to refer walk-in clients to other professionals in the network. It provides a streamlined, multi-step process to capture client details, find a suitable professional, and send the referral.

## Key Features

- **Multi-Step Workflow**: The form guides the user through a three-step process:
    1.  **Client Details**: Capture client information, referral type, and professional preferences.
    2.  **Professional Search**: Search for and select a suitable professional from the network.
    3.  **Profile Selection**: Choose a specific service and submit the referral.
- **Referral Types**: Supports different referral scenarios:
    - **Walk-In**: For clients who are physically present.
    - **Same-Day**: For clients who need an appointment on the same day.
    - **Coverage**: For when a professional needs another to cover their clients.
- **Flexible Routing**: Referrals can be routed to:
    - The user's **Trusted Network**.
    - All **Nearby** professionals.
- **Commission and Fees**: The form calculates the commission for the referrer and provides a clear breakdown of all fees.
- **Manual Payment**: An option for manual payment is available, with an additional fee.
- **Demo Mode Integration**: In demo mode, the form uses the `demoMatching` and `demoNotifications` services to simulate the referral process.

## Component Usage

The `WalkInReferralForm` is typically used within a modal or a dedicated page for sending referrals.

```tsx
import { WalkInReferralForm } from '@/components/referrals/WalkInReferralForm';

const MyPage = () => {
  return (
    <WalkInReferralForm onSuccess={() => console.log('Referral sent successfully!')} />
  );
};
```

## Data Flow

1.  The user fills in the client details and referral preferences in the first step.
2.  Based on the preferences, the `searchCandidates` function is called to find matching professionals.
3.  The user selects a professional from the search results and views their profile.
4.  The user then selects a specific service offered by the professional.
5.  Finally, the `handleSendReferral` function is called to submit the referral. This function interacts with the backend (or demo services) to send the referral notification to the selected professional.
