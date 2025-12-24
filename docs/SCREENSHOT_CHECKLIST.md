# SmartHostel – Screenshot Checklist

This document provides a structured guide for capturing screenshots of the SmartHostel application for project demonstration and documentation purposes.

---

## 📋 Instructions

### Preparation Steps

1. **Login as Admin**
   - Username: `admin`
   - Password: `Admin@123`

2. **Capture Both Themes**
   - Toggle between Light and Dark mode for each mandatory screen
   - Use the theme toggle button in the top navigation bar

3. **Full Page Capture**
   - Ensure the entire page content is visible
   - Include the sidebar navigation in all screenshots
   - Capture modals/dialogs when open

4. **Browser Settings**
   - Use a clean browser window (no extensions visible)
   - Recommended resolution: 1920x1080 or 1440x900
   - Zoom level: 100%

---

## 📸 Screenshots List

### 1. Authentication

#### Login Page
- [ ] `01-login-light.png` – Login page in light mode
- [ ] `02-login-dark.png` – Login page in dark mode

**Notes:**
- Show the login form with SmartHostel branding
- Ensure password field is empty (security)

---

### 2. Dashboard

#### Main Dashboard
- [ ] `03-dashboard-light.png` – Dashboard with metrics and chart (light mode)
- [ ] `04-dashboard-dark.png` – Dashboard with metrics and chart (dark mode)

**Notes:**
- Ensure all 4 stat cards are visible (Total Residents, Rooms Occupied, Pending Maintenance, Fees Pending)
- Include the Weekly Attendance Trend chart
- Show the "Last updated" timestamp

---

### 3. Residents Management

#### Residents List
- [ ] `05-residents-list-light.png` – Residents table view (light mode)
- [ ] `06-residents-list-dark.png` – Residents table view (dark mode)

#### Add Resident Modal
- [ ] `07-residents-add-modal-light.png` – Add resident form open (light mode)
- [ ] `08-residents-add-modal-dark.png` – Add resident form open (dark mode)

#### Resident Detail Panel
- [ ] `09-residents-detail-light.png` – Resident detail sidebar (light mode)
- [ ] `10-residents-detail-dark.png` – Resident detail sidebar (dark mode)

**Notes:**
- Show populated table with sample data
- In modal, show all form fields (Full Name, Email, Phone, Status)
- Detail panel should show resident information and room assignment

---

### 4. Rooms Management

#### Rooms Grid View
- [ ] `11-rooms-grid-light.png` – Rooms card grid (light mode)
- [ ] `12-rooms-grid-dark.png` – Rooms card grid (dark mode)

#### Assign Room Modal
- [ ] `13-rooms-assign-light.png` – Assign room form (light mode)
- [ ] `14-rooms-assign-dark.png` – Assign room form (dark mode)

**Notes:**
- Show room cards with occupancy status (Available, Occupied, Maintenance)
- Display room capacity and current occupancy
- Assign modal should show unallocated residents list

---

### 5. Attendance Tracking

#### Attendance List
- [ ] `15-attendance-list-light.png` – Attendance records table (light mode)
- [ ] `16-attendance-list-dark.png` – Attendance records table (dark mode)

#### Mark Attendance Modal
- [ ] `17-attendance-mark-light.png` – Mark attendance form (light mode)
- [ ] `18-attendance-mark-dark.png` – Mark attendance form (dark mode)

**Notes:**
- Show date filter in action
- Display attendance status (Present, Absent, Late)
- Include check-in time column

---

### 6. Fees Management

#### Fees List
- [ ] `19-fees-list-light.png` – Fee invoices table (light mode)
- [ ] `20-fees-list-dark.png` – Fee invoices table (dark mode)

#### Record Fee Modal
- [ ] `21-fees-add-modal-light.png` – Create invoice form (light mode)
- [ ] `22-fees-add-modal-dark.png` – Create invoice form (dark mode)

#### Payment Recording
- [ ] `23-fees-payment-light.png` – Record payment modal (light mode)
- [ ] `24-fees-payment-dark.png` – Record payment modal (dark mode)

**Notes:**
- Show status badges (Pending, Paid, Partial)
- Display amount, due date, and payment status
- Payment modal should show payment method options

---

### 7. Maintenance Requests

#### Maintenance List
- [ ] `25-maintenance-list-light.png` – Maintenance requests table (light mode)
- [ ] `26-maintenance-list-dark.png` – Maintenance requests table (dark mode)

#### Report Issue Modal
- [ ] `27-maintenance-add-light.png` – Create request form (light mode)
- [ ] `28-maintenance-add-dark.png` – Create request form (dark mode)

#### Status Update
- [ ] `29-maintenance-status-light.png` – Update status action (light mode)
- [ ] `30-maintenance-status-dark.png` – Update status action (dark mode)

**Notes:**
- Show status badges (Open, In Progress, Resolved)
- Display priority levels (Low, Medium, High)
- Include category filters

---

### 8. Visitors Management

#### Visitors Log
- [ ] `31-visitors-list-light.png` – Visitor entries table (light mode)
- [ ] `32-visitors-list-dark.png` – Visitor entries table (dark mode)

#### Log Visitor Modal
- [ ] `33-visitors-add-light.png` – Log visitor form (light mode)
- [ ] `34-visitors-add-dark.png` – Log visitor form (dark mode)

**Notes:**
- Show check-in and check-out times
- Display visitor status (Inside, Exited)
- Include ID type and last 4 digits

---

### 9. Mess Management

#### Mess Subscriptions List
- [ ] `35-mess-list-light.png` – Mess subscriptions table (light mode)
- [ ] `36-mess-list-dark.png` – Mess subscriptions table (dark mode)

#### Add Subscription Modal
- [ ] `37-mess-add-modal-light.png` – Create subscription form (light mode)
- [ ] `38-mess-add-modal-dark.png` – Create subscription form (dark mode)

#### Custom Dropdown
- [ ] `39-mess-dropdown-light.png` – Resident selection dropdown open (light mode)
- [ ] `40-mess-dropdown-dark.png` – Resident selection dropdown open (dark mode)

**Notes:**
- Show plan types (Standard Veg, Non-Veg, Premium)
- Display monthly fee and subscription dates
- Active/Inactive status badges
- Custom dropdown with visible options

---

### 10. Assets Management

#### Assets List
- [ ] `41-assets-list-light.png` – Assets table (light mode)
- [ ] `42-assets-list-dark.png` – Assets table (dark mode)

#### Add Asset Modal
- [ ] `43-assets-add-light.png` – Add asset form (light mode)
- [ ] `44-assets-add-dark.png` – Add asset form (dark mode)

**Notes:**
- Show asset categories (Furniture, Electronics, etc.)
- Display status (Functional, Repair, Broken)
- Include location information

---

### 11. Analytics (Admin Only)

#### Analytics Dashboard
- [ ] `45-analytics-light.png` – Analytics page (light mode)
- [ ] `46-analytics-dark.png` – Analytics page (dark mode)

**Notes:**
- Show charts and graphs
- Display key performance indicators

---

### 12. RBAC Demonstration

#### Staff Login
- [ ] `47-staff-login.png` – Login as staff user

#### Staff Sidebar (Restricted)
- [ ] `48-staff-sidebar-light.png` – Staff view with limited menu items (light mode)
- [ ] `49-staff-sidebar-dark.png` – Staff view with limited menu items (dark mode)

**Notes:**
- Staff should only see: Dashboard, Attendance, Visitors, Maintenance
- No access to: Residents, Rooms, Fees, Mess, Assets, Analytics

#### Access Denied Page
- [ ] `50-access-denied-light.png` – Access denied page when staff tries admin route (light mode)
- [ ] `51-access-denied-dark.png` – Access denied page when staff tries admin route (dark mode)

**Notes:**
- Navigate to `/residents` or `/fees` as staff user
- Should show "Access Denied" message

---

### 13. UI Components & Features

#### Empty States
- [ ] `52-empty-state-light.png` – Empty state example (light mode)
- [ ] `53-empty-state-dark.png` – Empty state example (dark mode)

#### Toast Notifications
- [ ] `54-toast-success.png` – Success toast notification
- [ ] `55-toast-error.png` – Error toast notification

#### Search & Filters
- [ ] `56-search-filter-light.png` – Search and filter in action (light mode)
- [ ] `57-search-filter-dark.png` – Search and filter in action (dark mode)

**Notes:**
- Show toast appearing after an action
- Demonstrate search functionality on any table
- Show filter dropdowns in use

---

## 📝 Screenshot Naming Convention

Follow this pattern for consistency:

```
[sequence]-[module]-[action]-[theme].png
```

**Examples:**
- `03-dashboard-light.png`
- `07-residents-add-modal-light.png`
- `21-fees-add-modal-dark.png`
- `48-staff-sidebar-light.png`

**Rules:**
- Use lowercase with hyphens
- Include sequence number (01-57)
- Specify theme (light/dark) at the end
- Use descriptive action names (list, add, edit, modal, etc.)

---

## ✅ Verification Checklist

Before finalizing each screenshot, verify:

### Technical Quality
- [ ] No browser console errors visible
- [ ] No network errors in DevTools
- [ ] Page fully loaded (no loading spinners)
- [ ] All images and icons rendered correctly

### Visual Alignment
- [ ] Page content properly aligned
- [ ] No cut-off text or elements
- [ ] Sidebar fully visible
- [ ] Modal centered on screen (if applicable)

### Theme Consistency
- [ ] Dark mode: All backgrounds are dark, text is light
- [ ] Light mode: All backgrounds are light, text is dark
- [ ] No white/grey flashes or inconsistencies
- [ ] Table headers visible and properly styled
- [ ] Buttons and inputs match theme

### Content Quality
- [ ] Sample data is realistic (no "test test" or "asdf")
- [ ] Dates are recent and make sense
- [ ] No placeholder text visible
- [ ] No sensitive information exposed

### Functional State
- [ ] Forms show all required fields
- [ ] Tables show multiple rows (at least 3-5)
- [ ] Status badges clearly visible
- [ ] Action buttons present and styled

---

## 📂 Storage Organization

Recommended folder structure for screenshots:

```
screenshots/
├── 01-authentication/
│   ├── 01-login-light.png
│   └── 02-login-dark.png
├── 02-dashboard/
│   ├── 03-dashboard-light.png
│   └── 04-dashboard-dark.png
├── 03-residents/
│   ├── 05-residents-list-light.png
│   ├── 06-residents-list-dark.png
│   └── ...
├── 04-rooms/
├── 05-attendance/
├── 06-fees/
├── 07-maintenance/
├── 08-visitors/
├── 09-mess/
├── 10-assets/
├── 11-analytics/
├── 12-rbac/
└── 13-ui-components/
```

---

## 🎯 Priority Screenshots

If time is limited, capture these essential screenshots first:

1. **Must Have** (Core Functionality):
   - Login page (both themes)
   - Dashboard (both themes)
   - Residents list + add modal (both themes)
   - Rooms grid (both themes)
   - Fees list + add modal (both themes)
   - Mess list + add modal (both themes)

2. **Should Have** (Important Features):
   - Attendance tracking
   - Maintenance requests
   - Visitors log
   - Staff RBAC demo

3. **Nice to Have** (Polish):
   - Empty states
   - Toast notifications
   - Search/filter demos
   - All UI variations

---

## 📌 Notes

- **Consistency**: Use the same browser and resolution for all screenshots
- **Privacy**: Ensure no real personal data is visible
- **Quality**: Use PNG format for crisp, lossless images
- **Timing**: Capture screenshots after data is fully loaded
- **Context**: Include enough context (sidebar, header) to show the full application

---

**Last Updated**: 2025-11-30  
**Total Screenshots Required**: ~57 (minimum)  
**Estimated Time**: 2-3 hours for complete capture
