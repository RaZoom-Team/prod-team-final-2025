import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, MapPin, Settings } from 'lucide-react';
import { ROUTES } from '../../config';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '../../modules/user/api/userApi';
import { getOrganization } from '../../modules/admin/api/organizationApi';

const MobileBottomBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
  });

  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: getOrganization,
  });

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Only show on admin pages
  const isAdminPage = location.pathname.startsWith('/admin');
  const isHomePage = location.pathname === '/' || location.pathname === ROUTES.HOME;
  
  // Don't show bottom bar on home page
  if (isHomePage) return null;
  
  // Don't show if not logged in
  if (!user) return null;
  
  // Only show admin navigation in bottom bar if on admin pages
  if (isAdminPage) {
    const isOwner = user?.role === 'owner';
    
    return (
      <div className="mobile-bottom-bar md:hidden">
        <button
          className={`mobile-bottom-bar-item ${isActive(ROUTES.ADMIN_DASHBOARD) ? 'active' : ''} min-h-0 min-w-0`}
          onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}
          style={isActive(ROUTES.ADMIN_DASHBOARD) ? { color: organization?.primaryColor } : undefined}
        >
          <LayoutDashboard size={24} />
          <span className="mobile-bottom-bar-item-text">Дашборд</span>
        </button>
        
        <button
          className={`mobile-bottom-bar-item ${isActive(ROUTES.ADMIN_COWORKINGS) ? 'active' : ''} min-h-0 min-w-0`}
          onClick={() => navigate(ROUTES.ADMIN_COWORKINGS)}
          style={isActive(ROUTES.ADMIN_COWORKINGS) ? { color: organization?.primaryColor } : undefined}
        >
          <MapPin size={24} />
          <span className="mobile-bottom-bar-item-text">Коворкинги</span>
        </button>
        
        {isOwner && (
          <button
            className={`mobile-bottom-bar-item ${isActive(ROUTES.ORGANIZATION_SETTINGS) ? 'active' : ''} min-h-0 min-w-0`}
            onClick={() => navigate(ROUTES.ORGANIZATION_SETTINGS)}
            style={isActive(ROUTES.ORGANIZATION_SETTINGS) ? { color: organization?.primaryColor } : undefined}
          >
            <Settings size={24} />
            <span className="mobile-bottom-bar-item-text">Настройки</span>
          </button>
        )}
      </div>
    );
  }
  
  // Don't show bottom bar on non-admin pages
  return null;
};

export default MobileBottomBar;