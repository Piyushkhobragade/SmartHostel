import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface SelectOption {
    value: string
    label: string
}

interface SelectProps {
    label: string
    value: string
    onChange: (value: string) => void
    options: SelectOption[]
    placeholder?: string
    required?: boolean
    disabled?: boolean
}

export default function Select({
    label,
    value,
    onChange,
    options,
    placeholder = 'Select an option',
    required = false,
    disabled = false
}: SelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const selectedOption = options.find(opt => opt.value === value)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (optionValue: string) => {
        onChange(optionValue)
        setIsOpen(false)
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            {/* Hidden input for HTML5 form validation */}
            {required && (
                <input
                    type="text"
                    value={value}
                    onChange={() => { }}
                    required
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden="true"
                />
            )}

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full px-4 py-2.5 text-left border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-colors ${disabled
                        ? 'bg-gray-100 dark:bg-slate-800 cursor-not-allowed opacity-60'
                        : 'bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600'
                    } border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white`}
            >
                <div className="flex items-center justify-between">
                    <span className={selectedOption ? '' : 'text-gray-500 dark:text-gray-400'}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
                </div>
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {options.length === 0 ? (
                        <div className="px-4 py-2.5 text-gray-500 dark:text-gray-400 text-sm">
                            No options available
                        </div>
                    ) : (
                        options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelect(option.value)}
                                className={`w-full px-4 py-2.5 text-left hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors flex items-center justify-between ${option.value === value
                                        ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                                        : 'text-gray-900 dark:text-white'
                                    }`}
                            >
                                <span>{option.label}</span>
                                {option.value === value && (
                                    <Check className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                )}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
