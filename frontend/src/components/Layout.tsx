import { useState, useCallback } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ChangePasswordModal from './ChangePasswordModal';
import {
    LayoutDashboard,
    Users,
    BedDouble,
    CalendarCheck,
    Wrench,
    Banknote,
    Menu,
    LogOut,
    Bot,
    Activity,
    Settings,
    ChevronDown,
    ChevronRight,
    RefreshCw,
    Home,
    UserCheck,
    DoorOpen,
    Package,
    BarChart2,
    Clock,
    Zap,
    Sun,
    Moon,
    Database,
    Map
} from 'lucide-react';

// ─── Nav Definitions ──────────────────────────────────────────────────────────

// Operations-first — things a warden checks every day
const operationsNav = [
    { name: 'Mission Control', href: '/', icon: LayoutDashboard, exact: true },
    { name: 'Maintenance', href: '/maintenance', icon: Wrench },
    { name: 'Financial Health', href: '/fees', icon: Banknote },
    { name: 'Timeline', href: '/timeline', icon: Clock },
];

// Entity management — data modules, secondary importance
const entitiesNav = [
    { name: 'Residents', href: '/residents', icon: Users },
    { name: 'Rooms', href: '/rooms', icon: BedDouble },
    { name: 'Visitors', href: '/visitors', icon: UserCheck },
    { name: 'Attendance', href: '/attendance', icon: CalendarCheck },
    { name: 'Assets', href: '/assets', icon: Package },
    { name: 'Analytics', href: '/analytics', icon: BarChart2 },
];

// Tools — advanced/AI modules (exist as routes, intentionally grouped)
const toolsNav = [
    { name: 'Warden Copilot', href: '/copilot', icon: Bot },
    { name: 'Digital Twin', href: '/digital-twin', icon: Map },
    { name: 'Knowledge Mgr', href: '/knowledge-manager', icon: Database },
];

// Student navigation
const studentNavigation = [
    { name: 'My Hostel', href: '/student/dashboard', icon: Home },
    { name: 'My Room', href: '/student/room', icon: BedDouble },
    { name: 'My Fees', href: '/student/fees', icon: Banknote },
    { name: 'My Visitors', href: '/student/visitors', icon: Users },
    { name: 'My Attendance', href: '/student/attendance', icon: CalendarCheck },
    { name: 'AI Assistant', href: '/knowledge', icon: Bot },
];

// ─── Nav Link Component ───────────────────────────────────────────────────────

function NavLink({
    item,
    active,
    onClick,
}: {
    item: { name: string; href: string; icon: React.ElementType };
    active: boolean;
    onClick: () => void;
}) {
    const Icon = item.icon;
    return (
        <Link
            to={item.href}
            onClick={onClick}
            className={`group flex items-center gap-2.5 px-3 py-1.5 mx-1 mb-0.5 rounded text-[13px] font-medium transition-all duration-100 ${
                active
                    ? 'text-white'
                    : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
            }`}
            style={
                active
                    ? {
                          background: 'rgba(var(--color-primary), 0.20)',
                          borderLeft: '2px solid rgb(var(--color-primary))',
                          paddingLeft: '10px',
                      }
                    : { borderLeft: '2px solid transparent' }
            }
        >
            <Icon
                className="w-[15px] h-[15px] flex-shrink-0"
                style={{ color: active ? 'rgb(var(--color-info))' : undefined }}
            />
            <span className="truncate">{item.name}</span>
        </Link>
    );
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="px-4 pt-4 pb-1 text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: 'rgb(var(--text-muted))' }}
        >
            {children}
        </div>
    );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────

export default function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [entitiesExpanded, setEntitiesExpanded] = useState(false);
    const [toolsExpanded, setToolsExpanded] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [confirmLogout, setConfirmLogout] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const handleLogout = useCallback(() => {
        if (confirmLogout) {
            logout();
        } else {
            setConfirmLogout(true);
            setTimeout(() => setConfirmLogout(false), 3000);
        }
    }, [confirmLogout, logout]);

    const handleRefresh = useCallback(() => {
        navigate(0);
    }, [navigate]);

    const isStudent = user?.role === 'STUDENT';
    const closeSidebar = () => setIsSidebarOpen(false);

    const isActive = (href: string, exact = false) =>
        exact ? location.pathname === href : location.pathname === href || location.pathname.startsWith(href + '/');

    const getCurrentPageTitle = () => {
        const allRoutes = [
            ...operationsNav,
            ...entitiesNav,
            ...studentNavigation,
            { name: 'Analytics', href: '/analytics', icon: BarChart2 },
        ];
        const match = allRoutes.find(
            (r) => r.href === location.pathname || (r.href !== '/' && location.pathname.startsWith(r.href))
        );
        return match?.name || 'Dashboard';
    };

    // Is any entity page currently active? (to auto-expand section)
    const anyEntityActive = entitiesNav.some((r) => isActive(r.href));
    const showEntities = entitiesExpanded || anyEntityActive;

    return (
        <div className="min-h-screen flex text-[rgb(var(--text-primary))] bg-[rgb(var(--bg-app))]">
            {/* Skip to main content — keyboard accessibility */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium focus:text-white"
                style={{ background: 'rgb(var(--color-primary))' }}
            >
                Skip to main content
            </a>
            {/* Mobile overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/70 z-40 lg:hidden"
                    onClick={closeSidebar}
                />
            )}

            {/* ── Sidebar ── */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col
                    transform transition-transform duration-200 ease-in-out
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
                style={{
                    width: 220,
                    background: 'rgb(var(--bg-panel))',
                    borderRight: '1px solid rgb(var(--border-color))',
                }}
            >
                {/* Brand */}
                <div
                    className="h-12 flex items-center gap-2.5 px-4 flex-shrink-0"
                    style={{ borderBottom: '1px solid rgb(var(--border-color))' }}
                >
                    <div
                        className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, rgb(255,152,48), rgb(242,73,92))' }}
                    >
                        <Zap className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="text-[13px] font-bold tracking-tight" style={{ color: 'rgb(var(--text-primary))' }}>
                            SmartHostel
                        </span>
                        <span className="text-[9px] uppercase tracking-widest" style={{ color: 'rgb(var(--text-muted))' }}>
                            Operations
                        </span>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: 'none' }}>
                    {isStudent ? (
                        studentNavigation.map((item) => (
                            <NavLink key={item.href} item={item} active={isActive(item.href)} onClick={closeSidebar} />
                        ))
                    ) : (
                        <>
                            {/* Operations section */}
                            <SectionLabel>Operations</SectionLabel>
                            {operationsNav.map((item) => (
                                <NavLink
                                    key={item.href}
                                    item={item}
                                    active={isActive(item.href, item.exact)}
                                    onClick={closeSidebar}
                                />
                            ))}

                            {/* Entity Management (collapsible) */}
                            <SectionLabel>Management</SectionLabel>
                            <button
                                onClick={() => setEntitiesExpanded(!showEntities)}
                                className="flex items-center gap-2 w-full px-3 py-1.5 mx-1 mb-0.5 rounded text-[12px] transition-colors"
                                style={{
                                    color: showEntities ? 'rgb(var(--text-primary))' : 'rgb(var(--text-secondary))',
                                    background: showEntities ? 'rgba(var(--border-color),0.3)' : 'transparent',
                                    width: 'calc(100% - 8px)',
                                }}
                            >
                                <DoorOpen className="w-[15px] h-[15px] flex-shrink-0" />
                                <span className="flex-1 text-left font-medium">Entity Data</span>
                                {showEntities ? (
                                    <ChevronDown className="w-3 h-3 flex-shrink-0" />
                                ) : (
                                    <ChevronRight className="w-3 h-3 flex-shrink-0" />
                                )}
                            </button>
                            {showEntities &&
                                entitiesNav.map((item) => (
                                    <NavLink
                                        key={item.href}
                                        item={item}
                                        active={isActive(item.href)}
                                        onClick={closeSidebar}
                                    />
                                ))}

                            {/* Tools — advanced modules */}
                            <SectionLabel>Tools</SectionLabel>
                            <button
                                onClick={() => setToolsExpanded(!toolsExpanded)}
                                className="flex items-center gap-2 w-full px-3 py-1.5 mx-1 mb-0.5 rounded text-[12px] transition-colors"
                                style={{
                                    color: toolsExpanded ? 'rgb(var(--text-primary))' : 'rgb(var(--text-secondary))',
                                    background: toolsExpanded ? 'rgba(var(--border-color),0.3)' : 'transparent',
                                    width: 'calc(100% - 8px)',
                                }}
                            >
                                <Zap className="w-[15px] h-[15px] flex-shrink-0" />
                                <span className="flex-1 text-left font-medium">Advanced Tools</span>
                                {toolsExpanded ? (
                                    <ChevronDown className="w-3 h-3 flex-shrink-0" />
                                ) : (
                                    <ChevronRight className="w-3 h-3 flex-shrink-0" />
                                )}
                            </button>
                            {toolsExpanded &&
                                toolsNav.map((item) => (
                                    <NavLink
                                        key={item.href}
                                        item={item}
                                        active={isActive(item.href)}
                                        onClick={closeSidebar}
                                    />
                                ))}
                        </>
                    )}
                </nav>

                {/* Bottom: user + settings */}
                <div
                    className="flex-shrink-0 py-2 px-1"
                    style={{ borderTop: '1px solid rgb(var(--border-color))' }}
                >
                    <button
                        onClick={() => setShowChangePassword(true)}
                        className="flex items-center gap-2.5 w-full px-3 py-1.5 rounded text-[13px] transition-colors"
                        style={{ color: 'rgb(var(--text-secondary))' }}
                    >
                        <Settings className="w-[14px] h-[14px]" />
                        Settings
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full px-3 py-1.5 rounded text-[13px] transition-colors"
                        style={{ color: confirmLogout ? 'rgb(var(--color-warning))' : 'rgb(var(--color-danger))' }}
                        title={confirmLogout ? 'Click again to confirm sign out' : 'Sign out'}
                    >
                        <LogOut className="w-[14px] h-[14px]" />
                        {confirmLogout ? 'Confirm sign out?' : 'Sign out'}
                    </button>

                    {/* User pill */}
                    <div className="mt-2 px-3 flex items-center gap-2">
                        <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                            style={{ background: 'rgb(var(--color-primary))' }}
                        >
                            {user?.username?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div className="flex flex-col leading-none min-w-0">
                            <span
                                className="text-[12px] font-semibold truncate"
                                style={{ color: 'rgb(var(--text-primary))' }}
                            >
                                {user?.username || 'Admin'}
                            </span>
                            <span className="text-[9px] uppercase" style={{ color: 'rgb(var(--text-muted))' }}>
                                {user?.role}
                            </span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── Main Area ── */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Topbar */}
                <header
                    className="h-10 flex items-center justify-between px-4 flex-shrink-0"
                    style={{
                        background: 'rgb(var(--bg-panel))',
                        borderBottom: '1px solid rgb(var(--border-color))',
                    }}
                >
                    <div className="flex items-center gap-2">
                        <button
                            className="lg:hidden p-1"
                            onClick={() => setIsSidebarOpen(true)}
                            style={{ color: 'rgb(var(--text-secondary))' }}
                            aria-label="Open navigation menu"
                        >
                            <Menu className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1 text-[12px]">
                            <span style={{ color: 'rgb(var(--text-muted))' }}>SmartHostel</span>
                            <span style={{ color: 'rgb(var(--text-muted))' }}>/</span>
                            <span className="font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
                                {getCurrentPageTitle()}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div
                            className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px]"
                            style={{
                                border: '1px solid rgb(var(--border-color))',
                                color: 'rgb(var(--text-secondary))',
                                background: 'rgb(var(--bg-app))',
                            }}
                        >
                            <Activity className="w-3 h-3" />
                            Live
                        </div>
                        {/* Theme toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-1 rounded transition-colors hover:opacity-70"
                            style={{ color: 'rgb(var(--text-secondary))' }}
                            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                        >
                            {theme === 'dark'
                                ? <Sun className="w-3.5 h-3.5" />
                                : <Moon className="w-3.5 h-3.5" />
                            }
                        </button>
                        {/* Refresh current page */}
                        <button
                            onClick={handleRefresh}
                            className="p-1 rounded transition-colors hover:opacity-70"
                            style={{ color: 'rgb(var(--text-secondary))' }}
                            aria-label="Refresh page"
                            title="Refresh"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </header>

                {/* Page content */}
                <main
                    id="main-content"
                    className="flex-1 overflow-auto"
                    style={{ background: 'rgb(var(--bg-app))' }}
                >
                    <div className="p-3 lg:p-4 w-full max-w-full">
                        <Outlet />
                    </div>
                </main>
            </div>

            <ChangePasswordModal
                isOpen={showChangePassword}
                onClose={() => setShowChangePassword(false)}
            />
        </div>
    );
}
