import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { useEffect } from 'react';

export default function DarkModeToggle() {
    const { theme, toggleTheme } = useTheme();

    // Debug: Log theme changes
    useEffect(() => {
        console.log('Current theme:', theme);
        console.log('HTML element classes:', document.documentElement.className);
    }, [theme]);

    const handleClick = () => {
        console.log('Toggle clicked! Current theme:', theme);
        toggleTheme();
    };

    return (
        <button
            onClick={handleClick}
            className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            aria-label="Toggle dark mode"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {theme === 'light' ? (
                <Moon className="w-5 h-5 text-gray-700" />
            ) : (
                <Sun className="w-5 h-5 text-yellow-400" />
            )}
        </button>
    );
}
