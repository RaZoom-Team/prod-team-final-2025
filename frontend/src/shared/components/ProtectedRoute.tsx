import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUserFromToken } from '../../modules/user/api/authApi';
import { UserRole } from '../../modules/user/types';
import { ROUTES } from '../../config';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: UserRole;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const location = useLocation();
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUserFromToken,
  });

  // Handle authentication errors by redirecting to login
  useEffect(() => {
    if (error) {
      // If there's an authentication error, redirect to login
      window.location.href = ROUTES.LOGIN;
    }
  }, [error]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }

  if (!user) {
    // Save the current location to redirect back after login
    const returnPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${ROUTES.LOGIN}?returnTo=${returnPath}`} />;
  }

  if (role && user.role !== role && !(role === 'admin' && user.role === 'owner')) {
    return <Navigate to={ROUTES.HOME} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;