import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface AdminRouteProps {
    children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }
    
    // Debug: Log user state
    console.log('AdminRoute - User:', user);
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    
    // Check if user has admin role
    if (user.role !== 'admin') {
        console.log('User role:', user.role, 'Expected: admin');
        return <Navigate to="/login" replace />;
    }
    
    return <>{children}</>;
};
