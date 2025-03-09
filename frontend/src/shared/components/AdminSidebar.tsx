import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MapPin, Coffee, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '../../modules/user/api/userApi';
import { ROUTES } from '../../config';

const AdminSidebar: React.FC = () => {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
  });

  const isOwner = user?.role === 'owner';

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-full hidden md:block">
      <div className="p-4">
        <h2 className="text-xl font-bold">Панель администратора</h2>
      </div>
      <nav className="mt-6">
        <ul>
          <li>
            <NavLink 
              to={ROUTES.ADMIN_DASHBOARD} 
              className={({ isActive }) => 
                `flex items-center px-4 py-3 ${isActive ? 'bg-indigo-600' : 'hover:bg-gray-700'}`
              }
            >
              <LayoutDashboard size={20} className="mr-3" />
              Дашборд
            </NavLink>
          </li>
          <li>
            <NavLink 
              to={ROUTES.ADMIN_COWORKINGS} 
              className={({ isActive }) => 
                `flex items-center px-4 py-3 ${isActive ? 'bg-indigo-600' : 'hover:bg-gray-700'}`
              }
            >
              <MapPin size={20} className="mr-3" />
              Коворкинги
            </NavLink>
          </li>
          <li>
            <NavLink 
              to={ROUTES.ADMIN_SPACES} 
              className={({ isActive }) => 
                `flex items-center px-4 py-3 ${isActive ? 'bg-indigo-600' : 'hover:bg-gray-700'}`
              }
            >
              <Coffee size={20} className="mr-3" />
              Рабочие места
            </NavLink>
          </li>
          {isOwner && (
            <li>
              <NavLink 
                to={ROUTES.ORGANIZATION_SETTINGS} 
                className={({ isActive }) => 
                  `flex items-center px-4 py-3 ${isActive ? 'bg-indigo-600' : 'hover:bg-gray-700'}`
                }
              >
                <Settings size={20} className="mr-3" />
                Настройки организации
              </NavLink>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar;