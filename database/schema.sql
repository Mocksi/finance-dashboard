-- Check current values
SELECT 
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.avatar_url,
    c.id as company_id,
    c.name as company_name,
    c.domain as company_domain,
    c.logo_url as company_logo
FROM users u
LEFT JOIN companies c ON u.company_id = c.id;
