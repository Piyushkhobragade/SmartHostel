import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
    message: string
    type: ToastType
    onClose: () => void
}

export default function Toast({ message, type, onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose()
        }, 3000)
        return () => clearTimeout(timer)
    }, [onClose])

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-500" />,
        error: <AlertCircle className="w-5 h-5 text-red-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />
    }

    const styles = {
        success: 'bg-white border-green-100 text-gray-800',
        error: 'bg-white border-red-100 text-gray-800',
        info: 'bg-white border-blue-100 text-gray-800'
    }

    return (
        <div className={`flex items-center p-4 mb-3 rounded-lg shadow-lg border ${styles[type]} animate-slide-in-right min-w-[300px]`}>
            <div className="flex-shrink-0 mr-3">
                {icons[type]}
            </div>
            <div className="flex-1 text-sm font-medium">{message}</div>
            <button onClick={onClose} className="ml-3 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}
