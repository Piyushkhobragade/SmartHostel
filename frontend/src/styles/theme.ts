// SmartHostel Design System Theme Configuration

export const theme = {
    colors: {
        primary: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#2563eb', // Primary
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a',
        },
        accent: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#10b981', // Accent
            600: '#059669',
            700: '#047857',
            800: '#065f46',
            900: '#064e3b',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6',
    },
    gradients: {
        light: {
            background: 'from-blue-50 via-white to-indigo-50',
            card: 'from-white/80 to-blue-50/50',
        },
        dark: {
            background: 'from-slate-900 via-slate-800 to-slate-900',
            card: 'from-slate-800/80 to-slate-900/50',
        },
    },
    glass: {
        light: {
            background: 'rgba(255, 255, 255, 0.8)',
            border: 'rgba(255, 255, 255, 0.2)',
            shadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        },
        dark: {
            background: 'rgba(30, 41, 59, 0.8)',
            border: 'rgba(255, 255, 255, 0.1)',
            shadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        },
    },
    spacing: {
        page: 'p-6 lg:p-8',
        section: 'space-y-6',
        card: 'p-6',
        grid: 'gap-6',
    },
    borderRadius: {
        card: 'rounded-2xl',
        button: 'rounded-lg',
        input: 'rounded-lg',
        badge: 'rounded-full',
    },
};

export type Theme = typeof theme;
