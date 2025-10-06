# Open Chair List

This document provides a detailed description of the Open Chair List feature.

## 1. Overview

The Open Chair List page allows users (typically stylists or suite owners) to view and manage the "open chair" slots they have posted. It provides a real-time overview of their current and past postings.

The page is implemented in the `OpenChairList.tsx` component.

## 2. Features

### 2.1. View Open Chair Postings

- The page fetches and displays a list of all open chair postings created by the logged-in user.
- The list is ordered chronologically, with the most recent postings appearing first.
- A loading animation is displayed while the data is being fetched from the database.
- If the user has not posted any open chairs, a "No open chair posts yet." message is displayed.

### 2.2. Information Displayed

For each open chair posting, the following information is displayed in a card format:

- **Zip Code & Time Window:** The location and the time slot for the open chair.
- **Status:** The current status of the posting (e.g., `open`, `filled`, `expired`).
- **Expiration Date:** The date and time when the posting will expire.

### 2.3. Mark as Filled

- If a posting has a status of `open`, the user has the option to mark it as "filled".
- Clicking the "Mark Filled" button updates the status of the posting in the database to `filled`.
- This action is useful for manually managing the availability of a chair if it gets filled through a channel outside of the ClientPass system.

## 3. Data Model

The Open Chair List feature interacts with the `open_chairs` table in the Supabase database. The following fields are relevant to this feature:

- `id`: A unique identifier for the open chair posting.
- `user_id`: The ID of the user who created the posting.
- `zip_code`: The zip code of the location.
- `time_window`: The time slot for the open chair.
- `status`: The current status of the posting.
- `created_at`: The timestamp when the posting was created.
- `expires_at`: The timestamp when the posting will expire.
- `service_id`: The ID of the service associated with the open chair.

## 4. User Interface

The user interface consists of:

- A header with the application logo.
- A main content area that displays the list of open chair cards.
- A bottom navigation bar for navigating to other parts of the application.