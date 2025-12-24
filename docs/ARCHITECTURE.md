# SmartHostel Architecture Documentation

## 1. Overview

**SmartHostel** is a modern, full-stack hostel management system designed to streamline daily operations for hostel administrators. It provides a comprehensive solution for managing residents, room allocations, attendance tracking, visitor logs, asset management, maintenance requests, fee collection, and analytics.

### Core Modules

- **Residents** - Manage resident information, room allocations, and status
- **Rooms** - Track room availability, capacity, and allocations
- **Attendance** - Record daily check-ins and attendance logs
- **Visitors** - Log and track visitor entries and exits
- **Assets** - Manage hostel assets and inventory
- **Maintenance** - Track maintenance requests and their resolution
- **Fees** - Handle invoicing, payments, and fee collection
- **Analytics** - Visualize occupancy trends and financial metrics
- **Auth** - Secure authentication and authorization

---

## 2. Frontend Architecture

### Technology Stack

- **React 18** - UI library for building component-based interfaces
- **TypeScript** - Type-safe JavaScript for better developer experience
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Axios** - HTTP client for API communication
- **Lucide React** - Icon library for consistent UI elements

### Folder Structure

```
frontend/src/
├── pages/              # Page components (Residents, Rooms, Attendance, etc.)
├── components/
│   ├── ui/            # Reusable UI components (Button, Card, Table, EmptyState)
│   └── domain/        # Domain-specific components (future use)
├── services/          # API service layer (api.ts)
├── config/            # Configuration files (uiText, theme, constants)
├── types/             # TypeScript type definitions (resident, room, fee, etc.)
├── context/           # React Context providers (Auth, Toast, Theme)
└── styles/            # Global styles and Tailwind config
```

### Component Architecture

**Pages** are the top-level route components that:
- Fetch data using API services
- Manage local state (forms, filters, modals)
- Compose UI using reusable components
- Handle user interactions and events

**UI Components** (`components/ui/`) are reusable, presentational components:
- `Button` - Styled button with variants (primary, secondary, ghost, danger)
- `Card` - Container component with title, description, and actions
- `Table` - Data table with search, pagination, and custom columns
- `EmptyState` - Placeholder for empty data states
- `Input` - Form input with label and validation
- `Badge` - Status indicators with color variants
- `StatCard` - Dashboard statistics display

**Services** (`services/api.ts`) provide a clean API layer:
- Centralized Axios instance with interceptors
- JWT token attachment for authenticated requests
- Organized API methods by domain (residentsAPI, roomsAPI, etc.)
- Error handling and response transformation

**Config** (`config/`) centralizes application settings:
- `uiText.ts` - All user-facing text strings for consistency
- `theme.ts` - Design tokens (colors, spacing, typography)
- `constants.ts` - App-wide constants (routes, enums, validation rules)

**Types** (`types/`) define TypeScript interfaces:
- Domain types (Resident, Room, Attendance, etc.)
- Form data types
- API response types
- Common utility types (ApiResponse, PaginatedResponse)

### Theme System

The application supports **light and dark modes** through:
- Tailwind's `dark:` variant classes
- `ThemeContext` for theme state management
- `DarkModeToggle` component for user control
- Persistent theme preference in localStorage

---

## 3. Backend Architecture

### Technology Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Prisma** - Modern ORM for database access
- **PostgreSQL** - Relational database (or SQLite for development)
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication

### Folder Structure

```
backend/src/
├── routes/            # Express route definitions
├── controllers/       # Request handlers and business logic
├── middleware/        # Auth, validation, error handling
├── config/            # Database and app configuration
└── prisma/
    └── schema.prisma  # Database schema and models
```

### Database Models (Prisma Schema)

Core entities mapped in Prisma:

- **User** - Admin/staff accounts with authentication
- **Resident** - Hostel residents with contact info and status
- **Room** - Room details (number, type, capacity, status)
- **AttendanceLog** - Daily attendance records
- **VisitorLog** - Visitor check-in/check-out records
- **Asset** - Hostel assets and inventory items
- **MaintenanceRequest** - Maintenance issues and their status
- **FeeInvoice** - Fee invoices for residents
- **Payment** - Payment records linked to invoices
- **OccupancyHistory** - Historical occupancy data for analytics

### Request Flow

**Routes** (`routes/`) define API endpoints:
- Map HTTP methods to controller functions
- Apply middleware (authentication, validation)
- Group related endpoints (e.g., `/api/residents`)

**Controllers** (`controllers/`) handle requests:
- Parse and validate request data
- Call appropriate service methods
- Format and send responses
- Handle errors gracefully

**Middleware** (`middleware/`) provides cross-cutting concerns:
- `auth.middleware.ts` - JWT verification and user authentication
- Error handling and logging
- Request validation

**Prisma Client** provides database access:
- Type-safe database queries
- Automatic migrations
- Relationship handling
- Transaction support

---

## 4. Data Flow

### Request Flow Diagram

```
User Action (UI)
    ↓
API Service (axios)
    ↓
Express Route (/api/residents)
    ↓
Auth Middleware (verify JWT)
    ↓
Controller (resident.controller.ts)
    ↓
Prisma Client (database query)
    ↓
PostgreSQL Database
    ↓
Response (JSON)
    ↓
UI Update (React state)
```

### Example: Creating a Resident

1. **User Action**: User fills out "Add Resident" form and clicks "Create"
2. **Frontend**: 
   - Form validation
   - `residentsAPI.create(formData)` called
   - Axios POST request to `/api/residents`
3. **Backend**:
   - Request hits `POST /api/residents` route
   - Auth middleware verifies JWT token
   - `resident.controller.ts` receives request
   - Controller validates data
   - Prisma creates new resident record
   - Database saves the record
4. **Response**:
   - Success response with created resident data
   - Frontend receives response
   - Toast notification shows success
   - Table refreshes with new data

### Example: Marking Attendance

1. **User Action**: User selects resident, date, and status, then submits
2. **Frontend**:
   - `attendanceAPI.mark(formData)` called
   - POST request to `/api/attendance`
3. **Backend**:
   - Auth middleware validates token
   - `attendance.controller.ts` processes request
   - Prisma creates AttendanceLog record
   - Links to Resident via foreign key
4. **Response**:
   - Success confirmation
   - Frontend refreshes attendance table
   - Shows updated records for selected date

---

## 5. Extensibility & Maintainability

### Adding New Modules

The architecture supports easy addition of new features:

1. **Frontend**:
   - Create new page component in `pages/`
   - Add API methods to `services/api.ts`
   - Define types in `types/`
   - Add route in `App.tsx`
   - Reuse existing UI components

2. **Backend**:
   - Add Prisma model to `schema.prisma`
   - Run migration: `npx prisma migrate dev`
   - Create route file in `routes/`
   - Create controller in `controllers/`
   - Register route in `app.ts`

### Centralized Configuration

**Benefits of centralized config**:
- **uiText.ts** - Change all UI text from one file (easy i18n in future)
- **theme.ts** - Update design system globally
- **constants.ts** - Modify enums, routes, validation rules in one place

**Shared Components** reduce duplication:
- Consistent UI across all pages
- Single source of truth for styling
- Easy to update design system-wide
- Faster development of new features

### Loose Coupling

The architecture avoids tight coupling through:
- **Service Layer** - Pages don't directly call Axios, they use API services
- **Component Composition** - UI components are independent and reusable
- **Type Definitions** - Shared types ensure consistency without dependencies
- **Middleware Pattern** - Cross-cutting concerns are separated from business logic

### Future Upgrades

The structure supports:
- **Database Migration** - Prisma makes switching databases straightforward
- **API Versioning** - Routes can be versioned (`/api/v2/residents`)
- **Microservices** - Backend can be split into separate services
- **Mobile App** - Same backend APIs can serve mobile clients
- **Internationalization** - Centralized text makes i18n easy to add

---

## 6. Security & Validation

### Authentication & Authorization

- **JWT Tokens** - Secure, stateless authentication
  - Tokens issued on login
  - Stored in localStorage on frontend
  - Attached to requests via Axios interceptor
  - Verified by auth middleware on backend

- **Password Security**:
  - Passwords hashed with bcryptjs before storage
  - Never stored or transmitted in plain text
  - Minimum length validation enforced

- **Role-Based Access** (future enhancement):
  - User roles defined in database
  - Middleware can check permissions
  - Frontend can hide/show features based on role

### Input Validation

- **Frontend Validation**:
  - HTML5 form validation (required, email, tel)
  - TypeScript type checking
  - Client-side validation for better UX

- **Backend Validation**:
  - Request data validation in controllers
  - Prisma schema constraints (unique, required)
  - Error responses for invalid data

### Error Handling

- **Frontend**:
  - Try-catch blocks in async operations
  - Toast notifications for user feedback
  - Graceful degradation on API failures

- **Backend**:
  - Centralized error handling middleware
  - Consistent error response format
  - Logging for debugging and monitoring

### Security Best Practices

- HTTPS in production (recommended)
- CORS configuration for API access
- Environment variables for sensitive config
- SQL injection prevention via Prisma
- XSS protection through React's escaping

---

## Conclusion

SmartHostel's architecture is designed for **scalability**, **maintainability**, and **developer productivity**. The separation of concerns, centralized configuration, and reusable components make it easy to extend and modify the system as requirements evolve.

The use of modern technologies (React, TypeScript, Prisma) ensures type safety, better developer experience, and long-term maintainability. The clean separation between frontend and backend allows teams to work independently and enables future architectural changes with minimal disruption.
