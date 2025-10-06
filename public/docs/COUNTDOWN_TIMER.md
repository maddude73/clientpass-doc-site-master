# Countdown Timer Component

This document provides a detailed description of the `CountdownTimer` component.

## 1. Overview

The `CountdownTimer` component is a reusable UI element designed to display a real-time countdown to a specified target time. It is primarily used in scenarios where a time-sensitive action or event is pending, such as referral response deadlines.

## 2. Features

### 2.1. Real-time Countdown

-   Displays the remaining time in a user-friendly format (e.g., "09m 30s").
-   Updates every second to provide an accurate countdown.

### 2.2. Customizable Display

-   **Title:** A customizable title can be displayed above the timer (e.g., "Response Required", "Waiting for Response").
-   **Description:** An optional description can be provided to give more context to the timer.
-   **Recipient Name:** Can display the name of the recipient for whom the timer is relevant.

### 2.3. Status Handling

-   The component supports different statuses (e.g., `waiting`, `expired`).
-   The visual presentation of the timer can change based on its status (e.g., red color for expired timers).

### 2.4. Time-Up Callback

-   When the countdown reaches zero, a specified callback function (`onTimeUp`) is triggered.
-   This allows the parent component to handle events that occur when the time limit is reached (e.g., reassigning a referral).

## 3. Usage

The `CountdownTimer` component is used in pages like `ReferralTimersPage.tsx` and `WaitingForResponse.tsx` to manage time-sensitive referral actions.

```tsx
import { CountdownTimer } from '@/components/referrals/CountdownTimer';

const MyPage = () => {
  const handleTimeUp = () => {
    console.log('Time is up!');
    // Perform action, e.g., reassign referral
  };

  return (
    <CountdownTimer
      targetTime="2025-12-31T23:59:59Z" // ISO string
      onTimeUp={handleTimeUp}
      title="Deadline Approaching"
      description="Please respond to this request soon."
      status="waiting"
    />
  );
};
```

## 4. Props

-   `targetTime`: (string) An ISO 8601 formatted string representing the target end time of the countdown.
-   `onTimeUp`: (function) A callback function to be executed when the countdown reaches zero.
-   `title`: (string, optional) A title to display above the timer.
-   `description`: (string, optional) A description to display below the timer.
-   `recipientName`: (string, optional) The name of the recipient for whom the timer is relevant.
-   `status`: (string) The current status of the timer (e.g., `waiting`, `expired`).
-   `onAction`: (function, optional) A callback function for actions related to the timer (e.g., accept/decline).
