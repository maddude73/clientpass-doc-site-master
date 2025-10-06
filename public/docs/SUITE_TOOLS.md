---
id: 68dccbb8479feecff6266a9c
revision: 14
---

# Suite Tools

Suite Tools are a set of features designed specifically for salon suite owners and managers, enabling them to efficiently manage their suite operations, particularly around chair availability and in-suite referrals. These tools enhance the ability of suite owners to maximize their space utilization and foster a collaborative environment.

## Key Features

- **Enable Suite Tools**: Salon suite owners can enable these tools from their `StylistProfileSetup` page. This action updates their profile to reflect their role as a suite owner and unlocks access to the specialized features.
- **Post Open Chair**: The `PostOpenChairForm` component is a central part of Suite Tools. It allows owners to:
    - **Specify Location and Time**: Define when and where a chair is available.
    - **Select Services**: Indicate the types of services a visiting professional can offer.
    - **Set Commission**: Determine the commission percentage for the chair provider.
    - **Manage Capacity**: Specify the number of available seats.
    - **Target Audience**: Choose to broadcast the open chair to their trusted network or all nearby professionals.
    - **Handle Walk-In Clients**: Option to post an open chair specifically for a waiting walk-in client, including service type and price.
- **In-Suite Referrals**: Facilitates the management of referrals within the suite environment, allowing owners to connect their clients with available professionals.

## Enabling Suite Tools

Suite owners can enable these features from their profile setup:

```tsx
// src/components/stylist/StylistProfileSetup.tsx
const handleEnableSuiteTools = async () => {
  setLoading(true);
  try {
    const { error } = await updateProfile({ suite_owner: true, role_tag: 'suite_owner' });
    if (error) throw error as any;
    toast({ title: 'Suite Tools enabled', description: 'You can now manage suite features.' });
    navigate('/suite-tools'); // Redirect to suite management dashboard
  } catch (err: any) {
    toast({ title: 'Enable failed', description: err?.message || 'Could not enable Suite Tools', variant: 'destructive' });
  } finally {
    setLoading(false);
  }
};
```

## Posting an Open Chair

The `PostOpenChairForm` component is used to create and manage open chair listings. It ensures that all necessary details are captured for a successful match between a suite owner and a visiting professional.

```tsx
import { PostOpenChairForm } from '@/components/open-chair/PostOpenChairForm';

const SuiteDashboard = () => {
  return (
    <PostOpenChairForm onSuccess={() => console.log('Open Chair posted successfully!')} />
  );
};
```

This system streamlines the process of filling vacant chairs, providing flexibility for both suite owners and independent professionals seeking temporary workspace.