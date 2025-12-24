# SmartHostel – Smart Hostel Management System

A modern, full-stack web application designed to streamline hostel operations by managing residents, room allocations, mess subscriptions, fee collection, visitor logs, attendance tracking, and maintenance requests.

## Overview

SmartHostel provides a comprehensive solution for hostel administrators and staff to efficiently manage day-to-day operations. Built with a clean, intuitive interface and robust backend, it offers role-based access control, real-time analytics, and seamless dark/light mode support.

---

## Features

### Core Modules

- **Residents Management** – Register, update, and track student residents with detailed profiles
- **Room Allocation & Occupancy** – Manage room assignments, capacity, and availability status
- **Attendance Tracking** – Record daily resident presence with manual and RFID support
- **Visitor Log** – Track visitor check-ins and check-outs with security details
- **Maintenance Requests** – Handle hostel complaints and maintenance tasks with status tracking
- **Fees Management** – Create invoices, record payments, and track outstanding dues
- **Mess Subscriptions** – Manage meal plans and monthly mess billing for residents
- **Dashboard & Analytics** – Real-time insights with occupancy trends and key metrics
- **Assets Management** – Track hostel assets, their status, and maintenance history

### Security & Access Control

- **Role-Based Access Control (RBAC)** – Admin and Staff roles with granular permissions
- **JWT Authentication** – Secure token-based authentication
- **Protected Routes** – Frontend and backend route protection

### User Experience

- **Dark/Light Mode** – Seamless theme switching with full component support
- **Responsive Design** – Mobile-friendly interface with adaptive layouts
- **Real-time Feedback** – Toast notifications for all user actions
- **Search & Filters** – Quick data access with advanced filtering options

---

## Tech Stack

### Frontend
- **React** – Component-based UI library
- **TypeScript** – Type-safe development
- **Vite** – Fast build tool and dev server
- **Tailwind CSS** – Utility-first CSS framework
- **Axios** – HTTP client for API requests
- **React Router** – Client-side routing
- **Lucide React** – Modern icon library
- **Recharts** – Data visualization for analytics

### Backend
- **Node.js** – JavaScript runtime
- **Express** – Web application framework
- **TypeScript** – Type-safe server development
- **Prisma ORM** – Type-safe database client
- **SQLite** – Lightweight database (development)
- **JWT** – JSON Web Tokens for authentication
- **bcrypt** – Password hashing

### Development Tools
- **ESLint** – Code linting
- **Nodemon** – Auto-restart dev server
- **ts-node** – TypeScript execution

---

## Project Structure

```
smart-hostel/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── pages/           # Page components (Dashboard, Residents, etc.)
│   │   ├── components/      # Reusable UI components
│   │   ├── services/        # API client and service layer
│   │   ├── context/         # React context providers (Auth, Toast, Theme)
│   │   └── App.tsx          # Main application component
│   └── package.json
│
├── backend/                  # Express backend API
│   ├── src/
│   │   ├── routes/          # API route definitions
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic layer
│   │   ├── middleware/      # Auth and validation middleware
│   │   └── app.ts           # Express app configuration
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── package.json
│
└── docs/                     # Project documentation
    ├── TEST_PLAN.md         # Manual testing guide
    └── UPGRADE_GUIDE.md     # Version upgrade instructions
```

---

## Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Git**

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Create .env file with:
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your-secret-key-here"
   PORT=3000
   ```

4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

5. (Optional) Seed the database with sample data:
   ```bash
   npx ts-node src/scripts/createAdmin.ts
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

   Backend will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   Frontend will run on `http://localhost:5173`

### Default Credentials

**Admin Account:**
- Username: `admin`
- Password: `Admin@123`

**Staff Account:**
- Username: `staff`
- Password: `Staff@123`

> **Security Note:** Change these default credentials immediately in production environments.

---

## Usage Overview

### For Administrators

1. **Login** – Access the system with admin credentials
2. **Dashboard** – View real-time metrics and analytics
3. **Manage Residents** – Register new students, update profiles, assign rooms
4. **Room Management** – Allocate rooms, track occupancy, manage vacancies
5. **Mess Subscriptions** – Create meal plans, track monthly billing
6. **Fee Collection** – Generate invoices, record payments, monitor dues
7. **Attendance** – Mark daily presence, view attendance history
8. **Visitor Logs** – Register visitors, track check-ins/check-outs
9. **Maintenance** – Handle requests, update status, track resolutions
10. **Assets** – Manage hostel assets and maintenance schedules

### For Staff

Staff members have limited access to:
- Dashboard (view-only)
- Attendance tracking
- Visitor management
- Maintenance requests

---

## Key Features in Detail

### Dashboard Analytics
- Total residents count
- Room occupancy percentage
- Pending maintenance requests
- Outstanding fee collection
- Weekly attendance trends (bar chart)

### Mess Management
- Multiple meal plan options (Standard Veg, Non-Veg, Premium)
- Monthly subscription tracking
- Active/inactive status management
- Resident-wise billing

### Fee Management
- Invoice generation with due dates
- Partial and full payment recording
- Payment method tracking (Cash, Online, UPI, Card)
- Pending vs. paid status filtering

### Maintenance System
- Priority levels (Low, Medium, High)
- Status workflow (Open → In Progress → Resolved)
- Asset linking for equipment-related issues
- Category-based filtering

---

## Future Scope

- **Resident Self-Service Portal** – Allow residents to view their profiles, attendance, and fee status
- **Automated Mess Billing** – Generate monthly mess invoices based on subscription plans
- **Notification System** – Email/SMS alerts for fee due dates, maintenance updates, and announcements
- **Advanced Analytics** – ML-based occupancy forecasting and trend analysis
- **Mobile Application** – Native iOS/Android apps for on-the-go management
- **Biometric Integration** – Fingerprint/face recognition for attendance and access control
- **Payment Gateway** – Online fee payment integration with popular payment providers

---

## Testing

A comprehensive manual test plan is available in `docs/TEST_PLAN.md`. It covers:
- Authentication and RBAC
- CRUD operations for all modules
- Dark/light mode compatibility
- Responsive design testing
- Error handling scenarios

---

## Documentation

- **Test Plan** – `docs/TEST_PLAN.md`
- **Upgrade Guide** – `docs/UPGRADE_GUIDE.md`
- **Mess Migration** – `backend/MESS_MIGRATION.md`
- **Architecture** – `docs/ARCHITECTURE.md`
- **Known Limitations** – `docs/KNOWN_LIMITATIONS.md`
- **Accessibility & SEO** – `docs/ACCESSIBILITY_SEO_CHECKLIST.md`
- **Demo Flow** – `docs/DEMO_FLOW.md`

---

## Contributing

This is a student project developed as part of academic coursework. The codebase follows modular design principles for easy maintenance and extension.

### Code Organization
- **Frontend**: Component-based architecture with shared UI components
- **Backend**: Service-controller pattern with clear separation of concerns
- **Database**: Prisma ORM for type-safe database operations
- **API**: RESTful endpoints with consistent naming conventions

---

## License

This project is developed for educational purposes.

---

## Author

**Piyush Khobragade**

---

## Credits

Developed as a comprehensive hostel management solution with focus on:
- Clean, maintainable code
- Modern UI/UX design
- Scalable architecture
- Security best practices

---

## Known Issues

- Seed script (`seed.ts`) is currently disabled due to corruption – use `createAdmin.ts` for initial setup
- Prisma version can be upgraded from 5.10.0 to 7.0.1 (optional)

---

## Support

For issues or questions, please refer to the documentation in the `docs/` directory or check the inline code comments.

---

**SmartHostel** – Efficient hostel management made simple.
