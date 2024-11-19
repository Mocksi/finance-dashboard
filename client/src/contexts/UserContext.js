import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const API_BASE_URL = 'https://finance-dashboard-tfn6.onrender.com/api';

    const fetchUserProfile = async () => {
        const authHeader = localStorage.getItem('authHeader');
        
        if (!authHeader) {
            setLoading(false);
            setUser(null);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/account/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (response.status === 401) {
                localStorage.removeItem('authHeader');
                setUser(null);
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data || !data.email) {
                throw new Error('Invalid profile data received');
            }

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
            return userData;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            localStorage.removeItem('authHeader');
            setUser(null);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Only run once on mount
    useEffect(() => {
        const initializeAuth = async () => {
            const authHeader = localStorage.getItem('authHeader');
            if (authHeader) {
                try {
                    await fetchUserProfile();
                } catch (error) {
                    console.error('Initial auth check failed:', error);
                }
            } else {
                setLoading(false);
            }
        };
        
        initializeAuth();
    }, []); // Empty dependency array

    return (
        <UserContext.Provider value={{ user, loading, fetchUserProfile }}>
            {children}
        </UserContext.Provider>
    );
}; 