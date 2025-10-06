---
id: 68dccbb7479feecff6266a76
revision: 14
---

# CI/CD Strategy

## 1. Introduction

### 1.1 Purpose

This document outlines the Continuous Integration (CI) and Continuous Deployment (CD) strategy for the ClientPass application. The goal is to establish a fully automated pipeline for building, testing, and deploying the frontend application and backend infrastructure to ensure rapid, reliable, and consistent releases.

## 2. Core Technologies

- **Version Control**: GitHub
- **CI/CD Platform**: GitHub Actions
- **Frontend Hosting**: Vercel (recommended for its seamless integration with Vite/React)
- **Backend & Database**: Supabase (including Edge Functions and PostgreSQL)

## 3. Branching Strategy

We will adopt a **GitHub Flow** branching model, which is simple and well-suited for web applications that require frequent deployments.

- **`main` branch**: This is the primary branch. It represents the production-ready state of the application. All pull requests are merged into `main` after review and passing checks.
- **Feature branches**: All new work (features, bug fixes) must be done on a separate branch, created from `main`. Branch names should be descriptive (e.g., `feat/user-dashboard`, `fix/login-bug`).
- **Pull Requests (PRs)**: Changes are merged into `main` via a Pull Request. A PR must be reviewed by at least one other team member and must pass all automated CI checks before it can be merged.

## 4. Continuous Integration (CI) Pipeline

The CI pipeline will be managed by **GitHub Actions**. A workflow file will be created at `.github/workflows/ci.yml`.

- **Trigger**: The CI workflow will run on every `push` to any branch and on every `pull_request` targeting the `main` branch.

- **Jobs**:
  1.  **Lint**: Runs `npm run lint` to enforce code style and catch syntax errors early.
  2.  **Unit & Integration Tests**: Runs `npm run test` to execute all automated tests using Jest and React Testing Library. This is a critical quality gate.
  3.  **Build**: Runs `npm run build` to ensure the Vite application compiles successfully for production. This catches type errors and build configuration issues.

If any of these jobs fail, the PR will be blocked from merging.

## 5. Continuous Deployment (CD) Pipeline

The CD pipeline will handle the deployment of the frontend and backend to different environments.

### 5.1 Staging Environment

- **Purpose**: A pre-production environment that mirrors production for final testing and UAT.
- **Trigger**: Automatic deployment on every merge to the `main` branch.
- **Frontend Deployment**: The project will be linked to Vercel. Vercel will automatically detect pushes to `main` and deploy the frontend, providing a stable staging URL.
- **Backend Deployment**: The GitHub Actions workflow will use the **Supabase CLI** to deploy backend changes:
  - **Database Migrations**: `supabase db push` will apply any new migrations from the `supabase/migrations` directory to the staging Supabase project.
  - **Edge Functions**: `supabase functions deploy` will deploy all functions in the `supabase/functions` directory.

### 5.2 Production Environment

- **Purpose**: The live environment for end-users.
- **Trigger**: Manual deployment for controlled releases. This can be a manual workflow dispatch in GitHub Actions or by promoting a Vercel deployment.
- **Frontend Deployment**: A Vercel deployment from the `main` branch that has been verified on staging is promoted to the production domain.
- **Backend Deployment**: The same GitHub Actions workflow used for staging will be run with production environment variables to deploy database migrations and Edge Functions to the production Supabase project.

## 6. Database Migrations

Database schema changes will be managed through Supabase's migration system.

1.  **Local Development**: Developers create new migration files using the Supabase CLI: `supabase migration new <migration_name>`.
2.  **Committing**: The generated SQL file in `supabase/migrations` is committed to the feature branch.
3.  **Deployment**: The CI/CD pipeline automatically applies the new migration to the staging and production databases using `supabase db push` during deployment.

## 7. Environment Variables and Secrets

Secrets and environment-specific variables will be managed securely:

- **GitHub Actions Secrets**: Used to store `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, and other tokens required for the CI/CD pipeline to interact with Supabase.
- **Vercel Environment Variables**: Used to store frontend-specific variables like `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Separate sets of variables will be maintained for `Preview` (staging) and `Production` environments.
- **Supabase Environment Variables**: Used for secrets required by Edge Functions (e.g., API keys for third-party services like Resend). These are managed directly in the Supabase project dashboard.
