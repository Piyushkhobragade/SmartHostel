import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccessDenied from './AccessDenied';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[]; // Optional: if not provided, only checks authentication
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { isAuthenticated, loading, user } = useAuth();

    // Show loading spinner while checking auth
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Check role-based access if allowedRoles is specified
    if (allowedRoles && allowedRoles.length > 0) {
        const userRole = user?.role || 'ADMIN';
        if (!allowedRoles.includes(userRole)) {
            return <AccessDenied />;
        }
    }

    // Render protected content
    return <>{children}</>;
}
