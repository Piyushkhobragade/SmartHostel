import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DarkModeToggle from './DarkModeToggle';
import ChangePasswordModal from './ChangePasswordModal';
import {
    LayoutDashboard,
    Users,
    BedDouble,
    CalendarCheck,
    Package,
    Wrench,
    Banknote,
    BarChart3,
    Menu,
    LogOut,
    Bell,
    KeyRound,
    UtensilsCrossed
} from 'lucide-react';

export default function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const location = useLocation();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        if (confirm('Are you sure you want to logout?')) {
            logout();
        }
    };

    const navigation = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['ADMIN', 'STAFF', 'RESIDENT'] },
        { name: 'Residents', href: '/residents', icon: Users, roles: ['ADMIN'] },
        { name: 'Rooms', href: '/rooms', icon: BedDouble, roles: ['ADMIN'] },
        { name: 'Attendance', href: '/attendance', icon: CalendarCheck, roles: ['ADMIN', 'STAFF'] },
        { name: 'Visitors', href: '/visitors', icon: Users, roles: ['ADMIN', 'STAFF'] },
        { name: 'Assets', href: '/assets', icon: Package, roles: ['ADMIN'] },
        { name: 'Maintenance', href: '/maintenance', icon: Wrench, roles: ['ADMIN', 'STAFF'] },
        { name: 'Fees', href: '/fees', icon: Banknote, roles: ['ADMIN'] },
        { name: 'Mess', href: '/mess', icon: UtensilsCrossed, roles: ['ADMIN'] },
        { name: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['ADMIN'] },
    ];

    // Filter navigation based on user role
    const filteredNavigation = navigation.filter(item =>
        item.roles.includes(user?.role || 'ADMIN')
    );

    const isActive = (path: string) => location.pathname === path;

    // Get current page title
    const getCurrentPageTitle = () => {
        const currentRoute = navigation.find(item => item.href === location.pathname);
        return currentRoute?.name || 'Dashboard';
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl lg:shadow-none transform transition-all duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    }`}
            >
                <div className="h-full flex flex-col">
                    {/* Logo / Brand */}
                    <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                                <BedDouble className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                SmartHostel
                            </span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                        {filteredNavigation.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`group relative flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ease-out ${active
                                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-700 dark:text-blue-400 shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                                        }`}
                                    onClick={() => setIsSidebarOpen(false)}
                                >
                                    {/* Active indicator - left border */}
                                    {active && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-r-full" />
                                    )}
                                    <Icon className={`w-5 h-5 mr-3 transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-105'}`} />
                                    <span className="flex-1">{item.name}</span>
                                    {active && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile */}
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-white dark:ring-slate-900">
                                    {user?.username?.charAt(0).toUpperCase() || 'A'}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                    {user?.username || 'Admin User'}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                                    {user?.role?.toLowerCase() || 'Admin'}
                                </p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Logout"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Role Badge */}
                        <div className="mt-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30">
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                                <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                                    {user?.role || 'ADMIN'}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowChangePassword(true)}
                            className="mt-2 w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                        >
                            <KeyRound className="w-3.5 h-3.5" />
                            Change Password
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Bar */}
                <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10 shadow-sm transition-colors duration-300">
                    <div className="flex items-center gap-4">
                        <button
                            className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* Current Page Title */}
                        <div className="hidden sm:block">
                            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                                {getCurrentPageTitle()}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <DarkModeToggle />

                        <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 relative rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
                        </button>

                        {/* User Avatar (Desktop) */}
                        <div className="hidden md:flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700">
                            <div className="text-right">
                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                    {user?.username || 'Admin'}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                                    {user?.role?.toLowerCase() || 'Admin'}
                                </p>
                            </div>
                            <div className="relative">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-md ring-2 ring-slate-100 dark:ring-slate-800">
                                    {user?.username?.charAt(0).toUpperCase() || 'A'}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-8 transition-all duration-300 ease-out">
                    <Outlet />
                </main>
            </div>

            {/* Change Password Modal */}
            <ChangePasswordModal
                isOpen={showChangePassword}
                onClose={() => setShowChangePassword(false)}
            />
        </div>
    );
}
