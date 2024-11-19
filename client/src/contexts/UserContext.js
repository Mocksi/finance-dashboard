import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const API_BASE_URL = 'https://finance-dashboard-tfn6.onrender.com/api';

    const fetchUserProfile = async () => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials) {
                setLoading(false);
                return;
            }

            console.log('Fetching profile...');

            const response = await fetch(`${API_BASE_URL}/account/profile`, {
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Accept': 'application/json'
                }
            });

            console.log('Response status:', response.status);

            if (response.ok) {
                const text = await response.text();
                console.log('Response text:', text);
                
                try {
                    const data = JSON.parse(text);
                    console.log('Parsed data:', data);
                    setUser(data);
                } catch (parseError) {
                    console.error('Error parsing JSON:', parseError);
                    throw new Error('Invalid JSON response');
                }
            } else if (response.status === 401) {
                localStorage.removeItem('credentials');
                navigate('/login');
            } else {
                const text = await response.text();
                console.error('Error response:', text);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserProfile();
    }, [navigate]);

    return (
        <UserContext.Provider value={{ user, setUser, loading, fetchUserProfile }}>
            {children}
        </UserContext.Provider>
    );
}; 