// SmartHostel UI Text Configuration
// Centralized source for all user-facing text

export const APP = {
    name: 'SmartHostel',
    tagline: 'Modern Hostel Management System',
    description: 'Streamline operations, track residents, and manage your hostel efficiently'
};

export const PAGES = {
    dashboard: {
        title: 'Dashboard',
        description: 'Overview of your hostel operations and key metrics'
    },
    residents: {
        title: 'Residents',
        description: 'Manage hostel residents and their accommodation details',
        empty: {
            title: 'No residents yet',
            description: 'Add your first resident to start managing hostel occupancy.',
            action: 'Add Resident'
        },
        form: {
            title: 'Add New Resident',
            editTitle: 'Edit Resident Details',
            fullName: 'Full Name',
            email: 'Email Address',
            phone: 'Phone Number',
            status: 'Status',
            room: 'Assigned Room'
        }
    },
    rooms: {
        title: 'Rooms',
        description: 'Configure and manage hostel rooms and allocations',
        empty: {
            title: 'No rooms configured',
            description: 'Create rooms to start allocating residents.',
            action: 'Add Room'
        },
        form: {
            title: 'Add New Room',
            editTitle: 'Edit Room Details',
            roomNumber: 'Room Number',
            capacity: 'Capacity',
            type: 'Room Type',
            status: 'Status'
        }
    },
    attendance: {
        title: 'Attendance',
        description: 'Track daily resident attendance and check-ins',
        empty: {
            title: 'No attendance records',
            description: 'Mark attendance for residents to see records here.'
        }
    },
    visitors: {
        title: 'Visitors',
        description: 'Log and monitor visitor check-ins and check-outs',
        empty: {
            title: 'No visitor entries',
            description: 'New visitor check-ins will appear in this list.'
        }
    },
    assets: {
        title: 'Assets',
        description: 'Track hostel assets and their maintenance status',
        empty: {
            title: 'No assets tracked',
            description: 'Add hostel assets to keep track of inventory and condition.',
            action: 'Add Asset'
        }
    },
    maintenance: {
        title: 'Maintenance',
        description: 'Manage maintenance requests and track repairs',
        empty: {
            title: 'No maintenance requests',
            description: 'Requests raised by staff or residents will show up here.',
            action: 'Create Request'
        }
    },
    fees: {
        title: 'Fee Management',
        description: 'Create and track hostel fee invoices and payments',
        empty: {
            title: 'No fee invoices',
            description: 'Create invoices to manage hostel fee payments and tracking.',
            action: 'Create Invoice'
        },
        form: {
            title: 'Create New Invoice',
            amount: 'Amount',
            dueDate: 'Due Date',
            status: 'Payment Status'
        }
    },
    analytics: {
        title: 'Analytics',
        description: 'View insights and reports on hostel operations'
    }
};

export const COMMON = {
    // Actions
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save Changes',
    cancel: 'Cancel',
    close: 'Close',
    submit: 'Submit',
    search: 'Search',
    filter: 'Filter',

    // States
    loading: 'Loading...',
    saving: 'Saving...',
    deleting: 'Deleting...',

    // Messages
    success: 'Operation completed successfully',
    error: 'Something went wrong. Please try again.',
    confirmDelete: 'Are you sure you want to delete this item?',
    noData: 'No data available',

    // Status
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
    completed: 'Completed',

    // Auth
    login: 'Login',
    logout: 'Logout',
    changePassword: 'Change Password',
    forgotPassword: 'Forgot Password?',

    // Validation
    required: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    invalidPhone: 'Please enter a valid phone number',
    passwordMismatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 6 characters'
};

export const TOAST_MESSAGES = {
    residents: {
        added: 'Resident successfully added to the system',
        updated: 'Resident details updated successfully',
        deleted: 'Resident removed from the system'
    },
    rooms: {
        added: 'Room created successfully',
        updated: 'Room details updated',
        deleted: 'Room removed from the system'
    },
    fees: {
        created: 'Invoice created successfully',
        paid: 'Payment recorded successfully',
        deleted: 'Invoice deleted'
    },
    auth: {
        loginSuccess: 'Welcome back!',
        loginFailed: 'Invalid credentials. Please try again.',
        passwordChanged: 'Password changed successfully',
        passwordReset: 'Password reset successfully'
    }
};
