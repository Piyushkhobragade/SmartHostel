# SmartHostel - Manual Test Plan

## 1. Introduction

SmartHostel is a comprehensive hostel management system designed to streamline operations including resident management, room allocation, attendance tracking, visitor logs, maintenance requests, and fee collection. This test plan ensures all features work correctly, maintain data integrity, and provide a seamless user experience across different user roles.

## 2. Test Environment

### Setup Requirements
- **Frontend**: Development server running on `http://localhost:5173`
- **Backend**: API server running on `http://localhost:3000`
- **Database**: PostgreSQL with sample data loaded

### Test Credentials
- **Admin**: `admin` / `Admin@123`
- **Staff**: `staff` / `Staff@123` (if configured)
- **Resident**: `resident` / `Resident@123` (if configured)

### Browser Support
- Chrome (latest)
- Firefox (latest)
- Edge (latest)

---

## 3. Test Scenarios by Module

### 3.1 Authentication & RBAC

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| AUTH-01 | Admin login success | 1. Navigate to login page<br>2. Enter `admin` / `Admin@123`<br>3. Click Login | User logged in, redirected to Dashboard, all menu items visible | ☐ |
| AUTH-02 | Login with invalid credentials | 1. Navigate to login page<br>2. Enter invalid username/password<br>3. Click Login | Error toast displayed: "Invalid credentials" | ☐ |
| AUTH-03 | Staff restricted menu | 1. Login as Staff user<br>2. Check sidebar navigation | Only Dashboard, Attendance, Visitors, Maintenance visible (no Residents, Rooms, Assets, Fees, Analytics) | ☐ |
| AUTH-04 | Access denied for unauthorized page | 1. Login as Staff<br>2. Manually navigate to `/residents` | Access Denied page displayed with message | ☐ |
| AUTH-05 | Logout functionality | 1. Login as any user<br>2. Click logout button in sidebar<br>3. Confirm logout | User logged out, redirected to login page | ☐ |
| AUTH-06 | Session persistence | 1. Login as admin<br>2. Refresh page | User remains logged in, session maintained | ☐ |

### 3.2 Dashboard

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| DASH-01 | Dashboard loads successfully | 1. Login as admin<br>2. Navigate to Dashboard | Dashboard displays with 4 stat cards and chart | ☐ |
| DASH-02 | Stats cards show correct data | 1. View Dashboard<br>2. Check each stat card | Total Residents, Occupied Rooms, Pending Maintenance, Fees Pending show accurate counts | ☐ |
| DASH-03 | Weekly attendance chart renders | 1. View Dashboard<br>2. Scroll to chart section | Bar chart displays last 7 days of attendance data | ☐ |
| DASH-04 | Chart with no data | 1. View Dashboard with empty attendance<br>2. Check chart area | Empty state message: "No attendance data available" | ☐ |
| DASH-05 | Dark mode toggle | 1. Click dark mode toggle<br>2. Check all dashboard elements | All cards, chart, and text adapt to dark theme without visual glitches | ☐ |

### 3.3 Residents

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| RES-01 | Add new resident | 1. Navigate to Residents<br>2. Click "Register Resident"<br>3. Fill all required fields<br>4. Submit form | Success toast, resident added to table, modal closes | ☐ |
| RES-02 | Validation for missing fields | 1. Click "Register Resident"<br>2. Leave required fields empty<br>3. Try to submit | Form validation prevents submission, error messages shown | ☐ |
| RES-03 | Edit existing resident | 1. Click edit icon on a resident<br>2. Modify details<br>3. Save changes | Success toast, resident details updated in table | ☐ |
| RES-04 | Delete resident | 1. Click delete icon<br>2. Confirm deletion | Confirmation dialog appears, resident removed from list after confirmation | ☐ |
| RES-05 | Search residents | 1. Enter name in search box<br>2. Verify results | Table filters to show matching residents only | ☐ |
| RES-06 | View resident details | 1. Click on a resident row<br>2. Check detail panel | Side panel opens with full resident information | ☐ |
| RES-07 | Filter by room status | 1. Click "Allocated" filter<br>2. Click "Unallocated" filter | Table shows only residents matching selected filter | ☐ |

### 3.4 Rooms

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| ROOM-01 | Add new room | 1. Navigate to Rooms<br>2. Click "Assign Room"<br>3. Enter room details<br>4. Submit | Success toast, room appears in grid | ☐ |
| ROOM-02 | Assign resident to room | 1. Click on a room card<br>2. Select "Assign Resident"<br>3. Choose unallocated resident<br>4. Confirm | Resident assigned, room occupancy updated, resident shows room number | ☐ |
| ROOM-03 | Vacate room | 1. Click on occupied room<br>2. Click "Vacate" on a resident<br>3. Confirm | Resident removed from room, occupancy decreases, resident marked as unallocated | ☐ |
| ROOM-04 | Room capacity validation | 1. Try to assign more residents than capacity<br>2. Attempt assignment | Error message: room at full capacity | ☐ |
| ROOM-05 | Edit room details | 1. Click edit on room<br>2. Modify type/status<br>3. Save | Room details updated successfully | ☐ |
| ROOM-06 | Delete empty room | 1. Click delete on room with 0 occupancy<br>2. Confirm | Room removed from list | ☐ |

### 3.5 Attendance

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| ATT-01 | Mark attendance for resident | 1. Navigate to Attendance<br>2. Click "Mark Attendance"<br>3. Select resident and date<br>4. Submit | Success toast, attendance record created | ☐ |
| ATT-02 | View attendance for specific date | 1. Select date from filter<br>2. View table | Table shows only attendance records for selected date | ☐ |
| ATT-03 | Prevent duplicate attendance | 1. Mark attendance for a resident<br>2. Try to mark again for same date | Error message: attendance already marked | ☐ |
| ATT-04 | Clear date filter | 1. Select a date filter<br>2. Click "Clear Filter"<br>3. View table | All attendance records displayed | ☐ |
| ATT-05 | Search attendance records | 1. Enter resident name in search<br>2. View results | Table filters to show matching records | ☐ |

### 3.6 Visitors

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| VIS-01 | Log visitor entry | 1. Navigate to Visitors<br>2. Click "Log Visitor"<br>3. Fill visitor details<br>4. Submit | Success toast, visitor appears in table with "Inside" status | ☐ |
| VIS-02 | Checkout visitor | 1. Find visitor with "Inside" status<br>2. Click "Checkout" button<br>3. Confirm | Checkout time recorded, status changes to "Exited" | ☐ |
| VIS-03 | Visitor form validation | 1. Click "Log Visitor"<br>2. Leave required fields empty<br>3. Try to submit | Form validation prevents submission | ☐ |
| VIS-04 | Search visitors | 1. Enter visitor or resident name<br>2. View results | Table filters to matching records | ☐ |
| VIS-05 | View visitor history | 1. Check table for past visitors<br>2. Verify checkout times | All visitor entries show check-in and check-out times correctly | ☐ |

### 3.7 Maintenance

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| MAIN-01 | Create maintenance request | 1. Navigate to Maintenance<br>2. Click "Report Issue"<br>3. Fill issue details<br>4. Submit | Success toast, request appears with "Open" status | ☐ |
| MAIN-02 | Update status to IN PROGRESS | 1. Click on Open request<br>2. Change status to "In Progress"<br>3. Save | Status badge updates to "In Progress" | ☐ |
| MAIN-03 | Resolve maintenance request | 1. Click on In Progress request<br>2. Change status to "Resolved"<br>3. Save | Status badge updates to "Resolved" | ☐ |
| MAIN-04 | Filter by status | 1. Click status filter dropdown<br>2. Select "Open"<br>3. View table | Only Open requests displayed | ☐ |
| MAIN-05 | Filter by priority | 1. Select "High" priority filter<br>2. View results | Only high priority requests shown | ☐ |
| MAIN-06 | Search maintenance requests | 1. Enter description keyword<br>2. View results | Table filters to matching requests | ☐ |

### 3.8 Fees

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| FEE-01 | Record new fee | 1. Navigate to Fees<br>2. Click "Record Fee"<br>3. Select resident, amount, due date<br>4. Submit | Success toast, invoice created with "Pending" status | ☐ |
| FEE-02 | Amount validation | 1. Click "Record Fee"<br>2. Enter negative or zero amount<br>3. Try to submit | Validation error: "Amount must be a positive number" | ☐ |
| FEE-03 | Record payment | 1. Click "Pay" on pending invoice<br>2. Enter payment amount<br>3. Select payment method<br>4. Submit | Payment recorded, status updates (Partial or Paid) | ☐ |
| FEE-04 | Partial payment | 1. Record payment less than total<br>2. Submit | Status changes to "Partial", remaining amount shown | ☐ |
| FEE-05 | Full payment | 1. Record payment equal to remaining<br>2. Submit | Status changes to "Paid", "Pay" button disappears | ☐ |
| FEE-06 | View pending vs paid | 1. Check fee records<br>2. Verify status badges | Pending/Partial invoices show correct status, paid invoices marked clearly | ☐ |
| FEE-07 | Search invoices | 1. Enter resident name<br>2. View results | Table filters to matching invoices | ☐ |

### 3.9 Assets (Admin Only)

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| AST-01 | Add new asset | 1. Navigate to Assets<br>2. Click "Add Asset"<br>3. Fill asset details<br>4. Submit | Success toast, asset appears in table | ☐ |
| AST-02 | Filter by category | 1. Select category filter (e.g., Furniture)<br>2. View results | Only assets of selected category shown | ☐ |
| AST-03 | Filter by status | 1. Select status filter (e.g., Functional)<br>2. View results | Only assets with selected status shown | ☐ |
| AST-04 | Edit asset | 1. Click edit on asset<br>2. Modify details<br>3. Save | Asset details updated successfully | ☐ |
| AST-05 | Delete asset | 1. Click delete on asset<br>2. Confirm | Asset removed from list | ☐ |

---

## 4. Cross-Cutting Concerns

### 4.1 Dark/Light Mode

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| THEME-01 | Toggle dark mode | 1. Click dark mode toggle in header<br>2. Check all pages | All pages switch to dark theme, no white flashes | ☐ |
| THEME-02 | Theme persistence | 1. Toggle dark mode<br>2. Refresh page | Theme preference persists across page reloads | ☐ |
| THEME-03 | Modal dark mode | 1. Enable dark mode<br>2. Open any modal form | Modal background, inputs, and text properly styled for dark mode | ☐ |
| THEME-04 | Table dark mode | 1. Enable dark mode<br>2. View any table | Table headers, rows, and borders visible in dark mode | ☐ |

### 4.2 Responsive Design

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| RESP-01 | Mobile sidebar | 1. Resize to mobile width<br>2. Click hamburger menu | Sidebar slides in from left, overlay appears | ☐ |
| RESP-02 | Tablet layout | 1. Resize to tablet width<br>2. Navigate pages | Stats cards show 2 columns, tables remain usable | ☐ |
| RESP-03 | Desktop layout | 1. View on desktop<br>2. Check all pages | Stats cards show 4 columns, optimal spacing | ☐ |

### 4.3 Error Handling

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| ERR-01 | Network error | 1. Stop backend server<br>2. Try any action | Error toast: "Failed to load/save data" | ☐ |
| ERR-02 | Empty states | 1. View module with no data<br>2. Check display | EmptyState component with helpful message and action button | ☐ |
| ERR-03 | Loading states | 1. Perform slow operation<br>2. Observe UI | Loading spinner shown, UI remains responsive | ☐ |

---

## 5. Regression Checklist

After any code changes, verify these critical flows:

### Authentication
- [ ] Admin can login successfully
- [ ] Invalid credentials show error
- [ ] Logout works correctly

### Dashboard
- [ ] Dashboard loads without errors
- [ ] All 4 stat cards display data
- [ ] Chart renders (or shows empty state)

### CRUD Operations (one per module)
- [ ] **Residents**: Add new resident
- [ ] **Rooms**: Assign resident to room
- [ ] **Attendance**: Mark attendance
- [ ] **Visitors**: Log visitor entry
- [ ] **Maintenance**: Create request
- [ ] **Fees**: Record fee invoice
- [ ] **Assets**: Add new asset

### UI/UX
- [ ] Dark mode toggle works on all pages
- [ ] Sidebar navigation works
- [ ] Mobile responsive (hamburger menu)
- [ ] Search/filter functions work
- [ ] Toast notifications appear

### Data Integrity
- [ ] No duplicate entries created
- [ ] Relationships maintained (resident-room)
- [ ] Status updates reflect correctly
- [ ] Calculations accurate (fees, occupancy)

---

## 6. Test Execution Guidelines

### Before Testing
1. Ensure both frontend and backend servers are running
2. Database has sample data loaded
3. Clear browser cache if testing fresh install
4. Use incognito/private window for clean session

### During Testing
1. Mark status as ✅ (Pass), ❌ (Fail), or ⚠️ (Partial)
2. Note any bugs or issues in a separate document
3. Take screenshots of failures
4. Test in both light and dark modes
5. Test on different screen sizes

### After Testing
1. Document all bugs found
2. Verify critical paths are working
3. Update this test plan if new features added
4. Share results with development team

---

## 7. Notes

- This is a **manual test plan**. Automated tests should complement this.
- Update test scenarios when new features are added.
- Priority: Focus on critical paths (Auth, Dashboard, one CRUD per module) first.
- For production deployment, all tests should pass before release.

---

**Last Updated**: 2025-11-29  
**Version**: 1.0  
**Maintained By**: SmartHostel Development Team
