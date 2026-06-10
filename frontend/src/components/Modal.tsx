import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

/**
 * Modal — canonical accessible modal shell for the entire application.
 *
 * WCAG 2.1 AA compliance:
 *  - role="dialog" + aria-modal="true" + aria-labelledby
 *  - Focus trap: Tab/Shift+Tab cycles within modal
 *  - Escape key closes modal
 *  - Focus restore: returns focus to the trigger element on close
 *  - Scroll lock: body overflow hidden while open
 *
 * Uses CSS variable tokens exclusively. No hardcoded Tailwind colours.
 */

type ModalWidth = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    /** Optional subtitle shown beneath the title */
    subtitle?: string;
    maxWidth?: ModalWidth;
    children: ReactNode;
}

const WIDTH_CLASS: Record<ModalWidth, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
};

/** All interactive element selectors for focus trap */
const FOCUSABLE_SELECTORS = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(', ');

export default function Modal({
    isOpen,
    onClose,
    title,
    subtitle,
    maxWidth = 'md',
    children,
}: ModalProps) {
    const titleId = useId();
    const panelRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<Element | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        // Save the element that triggered the modal so we can restore focus on close
        previousFocusRef.current = document.activeElement;

        // Lock body scroll
        document.body.style.overflow = 'hidden';

        // Defer focus so the panel is painted first
        const raf = requestAnimationFrame(() => {
            const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTORS);
            first?.focus();
        });

        const handleKeyDown = (e: KeyboardEvent) => {
            // Escape closes the modal
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
                return;
            }

            // Focus trap on Tab / Shift+Tab
            if (e.key !== 'Tab') return;
            const panel = panelRef.current;
            if (!panel) return;

            const focusable = Array.from(
                panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
            );
            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey) {
                // Shift+Tab at first element → jump to last
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                // Tab at last element → jump to first
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            cancelAnimationFrame(raf);
            document.removeEventListener('keydown', handleKeyDown);
            // Restore scroll and focus
            document.body.style.overflow = '';
            (previousFocusRef.current as HTMLElement | null)?.focus();
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Dialog panel */}
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={`relative rounded-xl shadow-2xl w-full ${WIDTH_CLASS[maxWidth]} animate-fadeIn`}
                style={{
                    background: 'rgb(var(--bg-panel))',
                    border: '1px solid rgb(var(--border-color))',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-5 py-4 border-b"
                    style={{ borderColor: 'rgb(var(--border-color))' }}
                >
                    <div>
                        <h2
                            id={titleId}
                            className="text-base font-semibold"
                            style={{ color: 'rgb(var(--text-primary))' }}
                        >
                            {title}
                        </h2>
                        {subtitle && (
                            <p
                                className="text-xs mt-0.5"
                                style={{ color: 'rgb(var(--text-muted))' }}
                            >
                                {subtitle}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded p-1 transition-colors hover:opacity-70"
                        style={{ color: 'rgb(var(--text-muted))' }}
                        aria-label="Close modal"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4">
                    {children}
                </div>
            </div>
        </div>
    );
}
