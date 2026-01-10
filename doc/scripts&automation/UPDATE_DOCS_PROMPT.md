# Prompt Template: Update Documentation from Git Diff

**Goal:** Update the documentation for the `clientpass-doc-site-master` project based on the latest code changes from the `style-referral-ring` project.

**Context:**
- The `style-referral-ring` project contains the source code for the application.
- The `clientpass-doc-site-master` project contains the documentation for the application.
- The documentation is written in Markdown and stored in the `public/docs` directory.
- The documentation is synced to a MongoDB database using the `update-docs.cjs` script.

**Instructions:**

1.  **Analyze the Git Diff:**
    - I will provide you with the output of `git diff` from the `style-referral-ring` project.
    - Please analyze this diff to identify any changes that require updates to the documentation. This could include:
        - New features or components.
        - Changes to existing features or components.
        - UI/UX changes.
        - Changes to the data model or API.

2.  **Update the Documentation:**
    - Based on your analysis, please update the relevant Markdown files in the `public/docs` directory of the `clientpass-doc-site-master` project.
    - If a new feature has been added, create a new documentation file for it and add it to the appropriate section in `src/pages/DevDocsPage.tsx`.
    - If an existing feature has been modified, update the corresponding documentation file to reflect the changes.
    - Please be as detailed and accurate as possible in your updates.

3.  **Sync to Database:**
    - After you have updated the documentation files, please run the `update-docs.cjs` script to sync the changes to the database.

**Example Usage:**

"Hello, I need you to update the documentation. Here is the `git diff` from the `style-referral-ring` project:

```diff
... (paste git diff here) ...
```

Please analyze these changes and update the documentation accordingly."
