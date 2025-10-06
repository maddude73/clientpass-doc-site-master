---
id: 68dccbb8479feecff6266a94
revision: 10
---

# Service Selection

The `ServiceSelection` component provides a simple and intuitive interface for clients to specify the type of service they are looking for. It is a key step in the booking process, helping to narrow down the search for the right professional.

## Key Features

- **Professional Type Selection**: Clients can choose between `Barber` and `Stylist` to indicate the type of professional they need.
- **Service Tag Filtering**: Once a professional type is selected, a list of relevant service tags is displayed. Clients can select one or more tags to specify the services they are interested in.
- **Selection Summary**: A summary of the selected professional type and service tags is displayed to the user.
- **Extensibility**: The service tags are managed in the `src/lib/enums.ts` file, making it easy to add, remove, or modify the available services.

## Component Usage

The `ServiceSelection` component is used at the beginning of the client's booking flow to gather their service requirements.

```tsx
import { ServiceSelection } from '@/components/client/ServiceSelection';
import { ServiceDiscipline } from '@/lib/enums';

const MyPage = () => {
  const handleSelectionComplete = (discipline: ServiceDiscipline, selectedTags: string[]) => {
    console.log('Selected discipline:', discipline);
    console.log('Selected tags:', selectedTags);
  };

  return (
    <ServiceSelection onSelectionComplete={handleSelectionComplete} />
  );
};
```

## Data Flow

1.  The user selects a professional type (Barber or Stylist).
2.  The component then displays the relevant service tags for the selected discipline.
3.  The user can select or deselect service tags.
4.  When the user clicks the "Find Professionals" button, the `onSelectionComplete` callback is called with the selected discipline and tags.
5.  The parent component can then use this information to search for matching professionals.
