---
id: 693f216859e2530fb4bca580
revision: 1
---
---
title: Navigation Flowchart
revision: 2.2
last_updated: November 8, 2025
---

This document describes the navigation flow of the application.

```mermaid
graph TD
    A[Index] --> B{User Logged In?};
    B -- Yes --> C[Dashboard];
    B -- No --> D[AuthPage];

    C --> E[Pro Dashboard];
    C --> F[Suite Dashboard];
    C --> G[Client Dashboard];
    C --> H[Affiliate Dashboard];

    H --> I[Affiliate Marketplace];

    F --> J[Suite Tools];
    J --> K[Post Open Chair];
    J --> L[Open Chair List];
    J --> M[Open Chair Alerts];

    G --> N[Share and Earn];
    G --> O[Client Referral];

    E --> P[Stylist Profile Setup];
    E --> Q[Stylist Profile];
    Q --> R[Boost Profile];
    E --> U[Coverage Mode];
    E --> V[Book Drawer];

    subgraph "Documentation"
        S[DevDocsPage] --> T[DocViewerPage];
    end

    A --> S;
```
```markdown
### Recent Updates

- **Coverage Mode**: A new feature has been added to the Pro Dashboard, allowing users to access the Coverage Mode page.
- **Book Drawer**: A new component, the Book Drawer, has been integrated into the Pro Dashboard for streamlined booking management.
- **Tab Navigation**: The Dashboard now supports URL-based tab navigation, allowing users to directly access specific tabs via URL parameters.
- **UI Consistency**: UI has been updated to ensure consistency across all pages.
- **Referral Auto-Pass**: Implemented Phase 13 of the Referral Auto-Pass feature.
```