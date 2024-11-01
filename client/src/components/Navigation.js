import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  FileText, 
  BarChart3, 
  Settings,
  LogOut 
} from 'lucide-react';

const Navigation = ({ onLogout }) => {
  const location = useLocation();
  
  const navItems = [
    { id: '/', label: 'Dashboard', icon: LayoutDashboard },
    { id: '/transactions', label: 'Transactions', icon: Receipt },
    { id: '/invoices', label: 'Invoices', icon: FileText },
    { id: '/reports', label: 'Reports', icon: BarChart3 },
    { id: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="h-screen w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">Finance Dashboard</h1>
      </div>
      
      <nav className="flex-1 p-4">
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