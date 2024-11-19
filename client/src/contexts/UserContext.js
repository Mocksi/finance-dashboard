import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchUserProfile = async () => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials) {
                setLoading(false);
                return;
            }

            const response = await fetch('https://finance-dashboard-tfn6.onrender.com/api/account/profile', {
                headers: {
                    'Authorization': `Basic ${credentials}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data);
            } else if (response.status === 401) {
                localStorage.removeItem('credentials');
                navigate('/login');
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserProfile();
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, loading, fetchUserProfile }}>
            {children}
        </UserContext.Provider>
    );
}; 