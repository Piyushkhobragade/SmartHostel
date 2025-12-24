interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label}
                </label>
            )}
            <input
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600'
                    } ${className}`}
                {...props}
            />
            {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
    );
}
