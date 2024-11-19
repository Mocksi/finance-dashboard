import React, { useContext } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { 
  LayoutDashboard, 
  Receipt, 
  FileText, 
  BarChart3,
  LogOut 
} from 'lucide-react';

const getInitialsColor = (name) => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500'
  ];
  const index = name.length % colors.length;
  return colors[index];
};

const Navigation = ({ onLogout }) => {
  const { user } = useContext(UserContext);
  const domain = user?.company_domain;
  const location = useLocation();
  const navigate = useNavigate();
  
  const navItems = [
    { id: '/', label: 'Dashboard', icon: LayoutDashboard },
    { id: '/transactions', label: 'Transactions', icon: Receipt },
    { id: '/invoices', label: 'Invoices', icon: FileText },
    { id: '/reports', label: 'Reports', icon: BarChart3 },
  ];

  // Update document title to always use "Financy"
  React.useEffect(() => {
    const currentPage = navItems.find(item => item.id === location.pathname)?.label || '';
    document.title = `Financy - ${currentPage}`;
  }, [location]);

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-gray-800 text-white flex flex-col z-10">
      <div className="p-4 border-b border-gray-700">
        {user?.company_logo ? (
          <img 
            src={user.company_logo} 
            alt="Company Logo"
            className="h-8 w-auto max-w-[200px] object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'block';
            }}
          />
        ) : (
          <h1 className="text-xl font-bold">
            Financy
          </h1>
        )}
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map(item => (
            <li key={item.id}>
              <NavLink
                to={`/${domain}${item.id}`}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 text-sm rounded-md hover:bg-gray-700 ${
                    isActive ? 'bg-gray-700 text-white' : 'text-gray-300'
                  }`
                }
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div 
          onClick={() => navigate('/settings')}
          className="mb-4 flex items-center cursor-pointer hover:bg-gray-700 p-2 rounded-md transition-colors"
        >
          <div className="flex-shrink-0">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-medium ${
                user?.first_name ? getInitialsColor(user.first_name) : 'bg-gray-600'
              }`}
              style={{ display: user?.avatar_url ? 'none' : 'flex' }}
            >
              {user?.first_name?.[0]?.toUpperCase() || '?'}
            </div>
          </div>
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-medium text-white truncate">
              {user?.first_name && user?.last_name 
                ? `${user.first_name} ${user.last_name}`
                : 'User Name'}
            </p>
            <p className="text-xs text-gray-300 truncate">
              {user?.role || 'Role not set'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {user?.email || 'Email not set'}
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-md"
        >
          <LogOut size={20} className="mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Navigation; 