import { useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useContext(UserContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            const authHeader = localStorage.getItem('authHeader');
            if (!loading && !user && !authHeader) {
                navigate('/login', { 
                    replace: true,
                    state: { from: location }
                });
            }
            setIsChecking(false);
        };

        checkAuth();
    }, [user, loading, navigate, location]);

    if (loading || isChecking) {
        return <div>Loading...</div>;
    }

    return user ? children : null;
};

export default ProtectedRoute; 