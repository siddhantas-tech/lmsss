import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

const Header = () => {
    const { user, logout } = useAuth();

    return (
        <header className="border-b bg-white">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link to="/" className="text-2xl font-bold text-blue-600">
                    LMS
                </Link>
                <nav className="flex items-center gap-4">
                    <Link to="/" className="text-sm font-medium hover:text-blue-600">
                        Browse
                    </Link>
                    {user ? (
                        <>
                            <span className="text-sm text-gray-600">Hi, {user.name}</span>
                            <Button variant="outline" size="sm" onClick={logout}>
                                Logout
                            </Button>
                        </>
                    ) : (
                        <>
                            <Link to="/login">
                                <Button variant="ghost" size="sm">
                                    Login
                                </Button>
                            </Link>
                            <Link to="/signup">
                                <Button size="sm">Sign Up</Button>
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;
