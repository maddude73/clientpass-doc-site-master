---
id: 68dccbb8479feecff6266a8a
revision: 10
---

# Post Open Chair Form

The `PostOpenChairForm` component allows salon suite owners and managers to post available chairs for other professionals to utilize. This form is a core part of the Suite Tools, enabling efficient management of temporary workspace and fostering collaboration within the professional community.

## Key Features

- **Location and Time Window**: Owners can specify the exact location and a time window (start and end times) for the open chair. The form includes validation to ensure the time window is in the future and does not exceed 12 hours.
- **Discipline Selection**: Owners must select the type of professional needed for the chair (Barber or Stylist), which helps in targeting the right audience.
- **Service Selection**: A comprehensive list of services is available, allowing owners to specify which services the visiting professional is allowed to perform. This list is dynamically filtered based on the selected discipline.
- **Chair Provider Earnings**: Owners can set the commission percentage they will earn from services performed in their open chair, with a slider for easy adjustment.
- **Capacity Control**: The form allows setting the number of available seats (capacity) for the open chair.
- **Audience Targeting**: Owners can choose to broadcast the open chair to their "Trusted Network" or to "All Nearby" professionals, providing flexibility in how they find a match.
- **Walk-In Client Option**: A unique feature that allows owners to indicate if they have a walk-in client waiting. If selected, additional fields appear to specify the walk-in service type and price, streamlining the process for immediate client service.
- **Notes**: An optional field for additional information such as parking, tools provided, or house rules.

## Component Usage

The `PostOpenChairForm` is typically integrated into a suite management dashboard or a dedicated page for owners to list their available chairs.

```tsx
import { PostOpenChairForm } from '@/components/open-chair/PostOpenChairForm';

const SuiteDashboard = () => {
  return (
    <PostOpenChairForm onSuccess={() => console.log('Open Chair posted successfully!')} />
  );
};
```

## Data Flow

1.  The form initializes by fetching available services from the backend.
2.  The owner fills in the details for the open chair, including location, time, discipline, services, commission, capacity, and audience.
3.  If the "Walk-In Client" option is selected, additional service and pricing details are captured.
4.  Upon submission, the `handleSubmit` function invokes a Supabase Edge Function (`post-open-chair`) with all the collected data.
5.  The Edge Function processes the request, creates the open chair listing, and potentially sends notifications to matching professionals.
6.  Success or error messages are displayed using `useToast`.
