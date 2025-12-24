import { Building2 } from 'lucide-react';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
    className?: string;
}

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
    const sizes = {
        sm: { icon: 'w-6 h-6', text: 'text-lg' },
        md: { icon: 'w-8 h-8', text: 'text-xl' },
        lg: { icon: 'w-12 h-12', text: 'text-3xl' }
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-500 dark:to-blue-700 rounded-lg blur-sm opacity-50"></div>
                <div className="relative bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-500 dark:to-blue-700 rounded-lg p-1.5 shadow-lg">
                    <Building2 className={`${sizes[size].icon} text-white`} strokeWidth={2} />
                </div>
            </div>
            {showText && (
                <span className={`${sizes[size].text} font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent`}>
                    SmartHostel
                </span>
            )}
        </div>
    );
}
