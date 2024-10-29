-- database/schema.sql

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for authentication)
CREATE TABLE users (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Financial transactions table
CREATE TABLE transactions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    debit DECIMAL(15,2) DEFAULT 0,
    credit DECIMAL(15,2) DEFAULT 0,
    department VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert test user (password is 'testpass123')
INSERT INTO users (email, password_hash) VALUES 
('admin@company.com', '$2b$10$xzuQxHXxAx4h8HVXVZh7z.TqR0yY1q6yZZx3r8HG7QxH3XjM1tXxK');

-- Insert sample transactions
INSERT INTO transactions (date, description, category, debit, credit, department) VALUES 
('2024-01-15', 'Software License', 'Operations', 2500.00, 0, 'IT'),
('2024-01-16', 'Client Payment', 'Revenue', 0, 15000.00, 'Sales'),
('2024-01-17', 'Office Supplies', 'Operations', 500.00, 0, 'Admin'),
('2024-01-18', 'Consulting Revenue', 'Revenue', 0, 8000.00, 'Consulting'),
('2024-01-19', 'Marketing Campaign', 'Marketing', 3500.00, 0, 'Marketing'),
('2024-01-20', 'Cloud Services', 'Operations', 1200.00, 0, 'IT');