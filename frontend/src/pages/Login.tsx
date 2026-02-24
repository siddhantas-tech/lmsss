import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { generateDevToken } from '@/api/auth';

const Login = () => {
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleDevLogin = async (role: string) => {
        setLoading(true);
        try {
            console.log('Attempting dev login for role:', role);
            const response = await generateDevToken(role);
            console.log('API response:', response);
            
            const token = response.data.token;
            const userData = {
                username: `dev-${role}`,
                role: role,
                name: `Dev ${role.charAt(0).toUpperCase() + role.slice(1)}`
            };
            
            console.log('Logging in with:', { token: token.substring(0, 20) + '...', userData });
            login(token, userData);
            
            console.log('Login successful, redirecting to:', role === 'admin' ? '/admin' : '/courses');
            window.location.href = role === 'admin' ? '/admin' : '/courses';
            
        } catch (error: any) {
            console.error('Dev login failed:', error);
            console.error('Error response:', error.response);
            console.error('Error message:', error.message);
            
            if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
                alert('Cannot connect to backend server. Please ensure:\n1. Backend server is running on port 4000\n2. No firewall blocking the connection');
            } else if (error.response?.status === 404) {
                alert('Backend endpoint not found. Check if the backend has the /dev/generate-token endpoint.');
            } else if (error.response?.status === 500) {
                alert('Backend server error. Check backend logs.');
            } else {
                alert('Login failed: ' + (error.message || 'Unknown error'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded shadow-md w-96">
                <h2 className="text-2xl font-bold mb-6">Development Login</h2>
                
                <div className="space-y-4">
                    <button
                        onClick={() => handleDevLogin('admin')}
                        disabled={loading}
                        className="w-full bg-red-600 text-white p-3 rounded hover:bg-red-700 disabled:opacity-50"
                    >
                        {loading ? 'Logging in...' : 'Login as Admin'}
                    </button>
                    <button
                        onClick={() => handleDevLogin('user')}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Logging in...' : 'Login as User'}
                    </button>
                </div>
                <p className="mt-6 text-sm text-gray-600 text-center">
                    This is a development environment. Use these buttons to test different user roles.
                </p>
                
                {/* Troubleshooting Info */}
                <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
                    <div className="font-medium mb-1">Troubleshooting:</div>
                    <ul className="space-y-1 text-gray-600">
                        <li>• Ensure backend server is running on port 4000</li>
                        <li>• Check console for detailed error messages</li>
                        <li>• Verify CORS settings on backend</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Login;
