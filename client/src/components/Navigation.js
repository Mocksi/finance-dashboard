import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { 
  LayoutDashboard, 
  Receipt, 
  FileText, 
  BarChart3, 
  Settings,
  LogOut 
} from 'lucide-react';

const Navigation = ({ onLogout }) => {
  const { user } = useContext(UserContext);
  const location = useLocation();
  
  const navItems = [
    { id: '/', label: 'Dashboard', icon: LayoutDashboard },
    { id: '/transactions', label: 'Transactions', icon: Receipt },
    { id: '/invoices', label: 'Invoices', icon: FileText },
    { id: '/reports', label: 'Reports', icon: BarChart3 },
    { id: '/settings', label: 'Settings', icon: Settings },
  ];

  // Update document title
  React.useEffect(() => {
    const currentPage = navItems.find(item => item.id === location.pathname)?.label || '';
    document.title = `${user?.company_name || 'Financy'} - ${currentPage}`;
  }, [location, user]);

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-gray-800 text-white flex flex-col z-10">
      <div className="p-4 border-b border-gray-700">
        {user?.company_logo ? (
          <img 
            src={user.company_logo} 
            alt={user.company_name}
            className="h-8 w-auto"
          />
        ) : (
          <h1 className="text-xl font-bold">
            {user?.company_name || 'Financy'}
          </h1>
        )}
      </div>
      
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <NavLink
                  to={item.id}
                  className={({ isActive }) => `
                    w-full flex items-center px-4 py-2 rounded-md transition-colors
                    ${isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-700'}
                  `}
                >
                  <Icon size={20} className="mr-3" />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="mb-4 flex items-center">
          <div className="flex-shrink-0">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
                {user?.first_name?.[0]}
              </div>
            )}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-300">
              {user?.role}
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