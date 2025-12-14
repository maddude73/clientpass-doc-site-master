---
id: 693f21681ae44aef92b3ec4e
revision: 1
---
# Service Catalog System

## Overview

The Service Catalog system is a comprehensive platform feature that enables centralized management of services offered across the platform. It provides administrators with tools to define, categorize, and maintain a standardized catalog of beauty and wellness services.

## Key Components

### AdminServiceCatalog Component

**Location**: `src/components/admin/modules/AdminServiceCatalog.tsx`

The AdminServiceCatalog component provides administrators with a comprehensive interface for managing the platform's service catalog.

**Features**:

- **Service Creation**: Add new services to the catalog with detailed information
- **Service Editing**: Modify existing service definitions
- **Service Categorization**: Organize services using the taxonomy system
- **Bulk Operations**: Manage multiple services efficiently
- **Search and Filter**: Quickly find specific services in the catalog

### Service Taxonomy System

**Location**: `src/lib/serviceTaxonomy.ts`

The service taxonomy provides a hierarchical categorization system for organizing services logically.

**Purpose**:

- Standardizes service naming and categorization
- Enables better search and discovery
- Supports consistent service selection across the platform
- Facilitates reporting and analytics

**Taxonomy Structure**:

- **Categories**: Top-level groupings (e.g., Hair, Nails, Skincare)
- **Subcategories**: More specific service types within categories
- **Service Types**: Individual service offerings

### ServiceTaxonomySelector Component

**Location**: `src/components/services/ServiceTaxonomySelector.tsx`

A reusable component for selecting services using the taxonomy structure.

**Features**:

- Hierarchical service selection
- Category-based filtering
- Type-ahead search
- Multi-select capability
- Integration with service catalog

### EnhancedServiceSelector Component

**Location**: `src/components/services/EnhancedServiceSelector.tsx`

An improved service selection interface that leverages the catalog system.

**Improvements Over Previous Version**:

- Better UX with taxonomy-based navigation
- Real-time service availability
- Pricing information display
- Service duration estimates
- Provider-specific service filtering

## Data Model

### Service Catalog Table

The `service_catalog` table stores the centralized service definitions:

**Key Fields**:

- `id`: Unique identifier
- `name`: Service name
- `category`: Top-level category
- `subcategory`: Specific service type
- `description`: Detailed service description
- `typical_duration`: Average service duration
- `typical_price_range`: Suggested pricing range
- `active`: Whether the service is currently offered
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

## User Workflows

### Admin: Adding a New Service

1. Navigate to Admin Console
2. Select "Service Catalog" module
3. Click "Add New Service"
4. Fill in service details:
   - Select category from taxonomy
   - Choose subcategory
   - Enter service name and description
   - Set typical duration
   - Define price range
5. Save the service

### Pro: Selecting Services During Profile Setup

1. During profile setup or service management
2. Use ServiceTaxonomySelector to browse services
3. Filter by category or search by name
4. Select applicable services
5. Customize pricing and duration for their business

### Client: Browsing Available Services

1. View services during referral or booking process
2. Services displayed using taxonomy categories
3. See provider-specific pricing and availability
4. Select desired service for appointment

## Integration Points

### Service Manager

The ServiceManager component (`src/components/services/ServiceManager.tsx`) was significantly refactored to integrate with the service catalog system.

**Changes**:

- Now pulls from centralized catalog instead of free-form input
- Validates services against catalog
- Maintains backward compatibility with existing data
- Supports custom services when needed

### Demo Data Seeder

**Location**: `src/services/demo/ServiceCatalogSeeder.ts`

Provides sample data for the service catalog in demo mode.

**Features**:

- Populates catalog with realistic beauty/wellness services
- Creates taxonomy structure
- Seeds pricing and duration data
- Supports testing and demonstrations

## Benefits

1. **Consistency**: Standardized service names and descriptions across the platform
2. **Efficiency**: Reduces data entry and prevents duplicate/similar services
3. **Analytics**: Better reporting on popular services and trends
4. **Scalability**: Easier to add new services and categories
5. **User Experience**: Improved service discovery and selection

## Future Enhancements

- Service recommendations based on client preferences
- Dynamic pricing suggestions based on market data
- Service bundling and packages
- Integration with booking duration and availability systems
- Multi-language support for service names and descriptions

## Related Documentation

- [Component Guide](COMPONENT_GUIDE.md)
- [Database Schema](DATABASE_SCHEMA.md)
- [Admin Dashboard](ADMIN_DASHBOARD.md)
- [Service Selection](SERVICE_SELECTION.md)
