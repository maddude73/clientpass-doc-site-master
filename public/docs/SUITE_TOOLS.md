---
id: 693f2168431945b24a8d7803
revision: 1
---
# Suite Tools

This document provides a detailed description of the Suite Tools feature, designed specifically for salon suite owners and managers.

## 1. Overview

Suite Tools are a comprehensive set of features enabling salon suite owners and managers to efficiently oversee their suite operations. This includes managing chair availability, facilitating in-suite referrals, and gaining insights into suite performance. These tools are crucial for maximizing space utilization, fostering a collaborative environment, and enhancing profitability.

The feature is primarily implemented within the `SuiteTools.tsx` component, which is accessed via the `SuiteToolsPage.tsx`.

## 2. Key Features

### 2.1. Enable Suite Tools

-   **Activation:** Salon suite owners can activate these specialized tools from their `StylistProfileSetup` page.
-   **Role Update:** Enabling Suite Tools updates the owner's profile to reflect their role as a suite owner, unlocking access to all associated features.

### 2.2. Open Chair Management

This section provides tools for managing the availability of chairs within the suite.

-   **Post Open Chair:**
    -   Allows owners to define when and where a chair is available.
    -   Specify service types a visiting professional can offer.
    -   Set commission percentages for the chair provider.
    -   Manage capacity by specifying the number of available seats.
    -   Target audience selection: broadcast to a trusted network or all nearby professionals.
    -   Option to post an open chair specifically for a waiting walk-in client, including service type and price.
-   **View Open Chairs:** Owners can view a list of all their active and past open chair postings, including their status and expiration.

### 2.3. In-Suite Referrals

This feature streamlines the process of managing referrals within the suite environment.

-   **Facilitated Connections:** Allows suite owners to connect their clients with available professionals within their own suite.
-   **Tracking:** Provides mechanisms to track the status and success of referrals made within the suite.
-   **Commission Management:** Helps in managing commission splits for in-suite referrals.

### 2.4. Suite Analytics

This section provides valuable insights into the suite's performance.

-   **Occupancy Rates:** Track the occupancy rate of chairs and suites over time.
-   **Referral Performance:** Analyze the success rate and revenue generated from in-suite referrals.
-   **Stylist Performance:** Gain insights into the performance of individual stylists within the suite.

## 3. Enabling Suite Tools

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
  }
} finally {
  setLoading(false);
};
```

## 4. Posting an Open Chair

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
