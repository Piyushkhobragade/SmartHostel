import { ShieldOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from './ui/Button';

export default function AccessDenied() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center max-w-md px-4">
                <div className="mb-6 flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                        <ShieldOff className="w-10 h-10 text-red-600 dark:text-red-400" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                    Access Denied
                </h1>

                <p className="text-slate-600 dark:text-slate-400 mb-6">
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
