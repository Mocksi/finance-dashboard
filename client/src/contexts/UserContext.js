import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const API_BASE_URL = 'https://finance-dashboard-tfn6.onrender.com/api';

    const fetchUserProfile = async () => {
        const credentials = localStorage.getItem('credentials');
        
        if (!credentials) {
            setLoading(false);
            navigate('/login');
            return;
        }

        try {
            console.log('Fetching profile with credentials:', credentials);
            
            const response = await fetch(`${API_BASE_URL}/users/profile`, {
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Profile response status:', response.status);

            if (response.status === 401) {
                localStorage.removeItem('credentials');
                setUser(null);
                navigate('/login');
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Profile data:', data);
            
            // Transform the data to match our frontend structure
            const userData = {
                id: data.user_id,
                email: data.email,
                first_name: data.first_name,
                last_name: data.last_name,
                role: data.role,
                avatar_url: data.avatar_url,
                company_id: data.company_id,
                company_name: data.company_name,
                company_domain: data.company_domain,
                company_logo: data.logo_url
            };

            setUser(userData);
        } catch (error) {
            console.error('Error fetching user profile:', error);
            if (error.message.includes('401')) {
                localStorage.removeItem('credentials');
                setUser(null);
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    // Fetch user profile on mount and when credentials change
    useEffect(() => {
        fetchUserProfile();
    }, []);

    return (
        <UserContext.Provider value={{ user, loading, fetchUserProfile }}>
            {children}
        </UserContext.Provider>
    );
}; 