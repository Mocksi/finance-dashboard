import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchUserProfile = async () => {
        const authHeader = localStorage.getItem('authHeader');
        if (!authHeader) {
            setUser(null);
            setLoading(false);
            return null;
        }

        const userData = {
            id: '1c571c71-b298-4d0f-8e30-43b1ec18dfa3',
            email: 'sarah.chen@techflow.io',
            first_name: 'Sarah',
            last_name: 'Chen',
            role: 'Admin',
            avatar_url: '/avatar.jpg',
            company_id: '1',
            company_name: 'TechFlow',
            company_domain: 'techflow.io',
            company_logo: '/logo.png'
        };

        setUser(userData);
        setLoading(false);
        return userData;
    };

    useEffect(() => {
        fetchUserProfile();
    }, []);

    return (
        <UserContext.Provider value={{ user, loading, fetchUserProfile }}>
            {children}
        </UserContext.Provider>
    );
}; 