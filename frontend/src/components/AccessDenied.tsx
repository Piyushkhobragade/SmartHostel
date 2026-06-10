import { ShieldOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from './Button';

export default function AccessDenied() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center max-w-md px-4">
                <div className="mb-6 flex justify-center">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(var(--color-danger), 0.10)' }}>
                        <ShieldOff className="w-10 h-10" style={{ color: 'rgb(var(--color-danger))' }} />
                    </div>
                </div>

                <h1 className="text-3xl font-bold mb-3" style={{ color: 'rgb(var(--text-primary))' }}>
                    Access Denied
                </h1>

                <p className="mb-6" style={{ color: 'rgb(var(--text-muted))' }}>
                    You don't have permission to access this page. Please contact your administrator if you believe this is an error.
                </p>

                <Link to="/">
                    <Button variant="primary">
                        Return to Dashboard
                    </Button>
                </Link>
            </div>
        </div>
    );
}
