import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Select — canonical custom dropdown using CSS variable tokens.
 * No hardcoded Tailwind colours.
 */

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
}

export default function Select({
    label,
    value,
    onChange,
    options,
    placeholder = 'Select an option',
    required = false,
    disabled = false,
}: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <label
                className="block text-sm font-medium mb-1"
                style={{ color: 'rgb(var(--text-secondary))' }}
            >
                {label} {required && <span style={{ color: 'rgb(var(--color-danger))' }}>*</span>}
            </label>

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
                className="input-field text-left flex items-center justify-between"
                style={{ opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
            >
                <span style={{ color: selectedOption ? 'rgb(var(--text-primary))' : 'rgb(var(--text-muted))' }}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    className="w-4 h-4 flex-shrink-0 transition-transform"
                    style={{
                        color: 'rgb(var(--text-muted))',
                        transform: isOpen ? 'rotate(180deg)' : undefined,
                    }}
                />
            </button>

            {isOpen && (
                <div
                    className="absolute z-50 w-full mt-1 rounded-lg shadow-lg max-h-60 overflow-auto custom-scrollbar"
                    style={{
                        background: 'rgb(var(--bg-panel))',
                        border: '1px solid rgb(var(--border-color))',
                    }}
                >
                    {options.length === 0 ? (
                        <div className="px-4 py-2.5 text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
                            No options available
                        </div>
                    ) : (
                        options.map(option => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelect(option.value)}
                                className="w-full px-4 py-2.5 text-left text-sm flex items-center justify-between transition-colors"
                                style={{
                                    color: option.value === value
                                        ? 'rgb(var(--color-primary))'
                                        : 'rgb(var(--text-primary))',
                                    background: option.value === value
                                        ? 'rgba(var(--color-primary), 0.08)'
                                        : 'transparent',
                                }}
                                onMouseEnter={e => {
                                    if (option.value !== value) {
                                        (e.currentTarget as HTMLElement).style.background = 'rgba(var(--border-color), 0.4)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (option.value !== value) {
                                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                                    }
                                }}
                            >
                                <span>{option.label}</span>
                                {option.value === value && (
                                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: 'rgb(var(--color-primary))' }} />
                                )}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
