import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, Settings, Home, User, MapPin } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from '../../modules/user/api/userApi';
import { getOrganization } from '../../modules/admin/api/organizationApi';
import { ROUTES } from '../../config';
import { logoutUser as apiLogoutUser, removeAuthToken } from '../../modules/user/api/authApi';

const Header: React.FC = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const isMobile = window.innerWidth < 768;
  const isHomePage = location.pathname === '/' || location.pathname === ROUTES.HOME;
  const isAdminPage = location.pathname.startsWith('/admin');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
  });

  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: getOrganization,
  });

  const logoutMutation = useMutation({
    mutationFn: apiLogoutUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  const handleLogout = () => {
    // Directly remove the token first to ensure it's gone
    removeAuthToken();
    localStorage.removeItem('currentUser');
    
    // Then trigger the mutation for any additional cleanup
    logoutMutation.mutate();
    
    // Use window.location for a full page reload to ensure clean state
    window.location.href = ROUTES.LOGIN;
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.name) return '?';
    
    const nameParts = user.name.split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  const isActive = (path: string) => location.pathname === path;
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';
  const isOwner = user?.role === 'owner';

  // Hide header on non-home pages for mobile
  if (isMobile && !isHomePage && !isAdminPage) {
    return null;
  }

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to={ROUTES.HOME} className="flex items-center">
              {organization?.logo ? (
                <img 
                  src={organization.logo} 
                  alt={organization.name} 
                  className="h-8 mr-2"
                />
              ) : (
                <span className="text-xl font-bold mr-2" style={{ color: organization?.primaryColor }}>
                  {organization?.name || "КоворкХаб"}
                </span>
              )}
            </Link>
          </div>
          
          {/* Admin Navigation Links - centered, only on desktop */}
          {isAdminPage && !isMobile && (
            <div className="flex items-center space-x-2 absolute left-1/2 transform -translate-x-1/2">
              <Link 
                to={ROUTES.ADMIN_DASHBOARD} 
                className={`px-4 py-2 rounded-lg text-base font-medium ${
                  isActive(ROUTES.ADMIN_DASHBOARD) 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                style={isActive(ROUTES.ADMIN_DASHBOARD) ? { 
                  backgroundColor: `${organization?.primaryColor}1a`,
                  color: organization?.primaryColor 
                } : undefined}
              >
                <LayoutDashboard size={18} className="inline-block mr-1" />
                Дашборд
              </Link>
              
              <Link 
                to={ROUTES.ADMIN_COWORKINGS} 
                className={`px-4 py-2 rounded-lg text-base font-medium ${
                  isActive(ROUTES.ADMIN_COWORKINGS) 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                style={isActive(ROUTES.ADMIN_COWORKINGS) ? { 
                  backgroundColor: `${organization?.primaryColor}1a`,
                  color: organization?.primaryColor 
                } : undefined}
              >
                <MapPin size={18} className="inline-block mr-1" />
                Коворкинги
              </Link>
              
              {isOwner && (
                <Link 
                  to={ROUTES.ORGANIZATION_SETTINGS} 
                  className={`px-4 py-2 rounded-lg text-base font-medium ${
                    isActive(ROUTES.ORGANIZATION_SETTINGS) 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={isActive(ROUTES.ORGANIZATION_SETTINGS) ? { 
                    backgroundColor: `${organization?.primaryColor}1a`,
                    color: organization?.primaryColor 
                  } : undefined}
                >
                  <Settings size={18} className="inline-block mr-1" />
                  Настройки
                </Link>
              )}
            </div>
          )}

          {/* User Menu */}
          <nav className="flex items-center space-x-4">
            {user ? (
              <div className="relative" ref={profileMenuRef}>
                <button 
                  className="w-10 h-10 rounded-full text-white flex items-center justify-center font-medium text-sm"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  aria-label="Меню пользователя"
                  style={{ backgroundColor: organization?.primaryColor }}
                >
                  {getUserInitials()}
                </button>
                
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-2 z-10">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-base font-medium text-gray-900 truncate">{user.name}</p>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                    
                    <Link 
                      to="/profile"
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User size={18} className="mr-3" />
                      <span className="text-base">Профиль</span>
                    </Link>
                    
                    {isAdmin && !isAdminPage && (
                      <Link 
                        to={ROUTES.ADMIN_DASHBOARD} 
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <LayoutDashboard size={18} className="mr-3" />
                        <span className="text-base">Панель администратора</span>
                      </Link>
                    )}
                    
                    {isAdminPage && (
                      <Link 
                        to={ROUTES.HOME} 
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Home size={18} className="mr-3" />
                        <span className="text-base">Главная</span>
                      </Link>
                    )}
                    
                    <button 
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 min-h-0"
                    >
                      <LogOut size={18} className="mr-3" />
                      <span className="text-base">Выйти</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                to={ROUTES.LOGIN} 
                className="btn-primary min-h-0 py-2"
                style={{ backgroundColor: organization?.primaryColor }}
              >
                Войти
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;