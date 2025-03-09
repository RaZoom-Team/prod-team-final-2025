import '@fontsource/pretendard/100'
import '@fontsource/pretendard/400'
import '@fontsource/pretendard/500'
import '@fontsource/pretendard/600'
import '@fontsource/pretendard/700'
import '@fontsource/pretendard/800'
import '@fontsource/pretendard/900'
import './styles.css'


import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ROUTES } from '../config';
import { getCurrentUserFromToken } from '../modules/user/api/authApi';

// Pages
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import OrganizationSettingsPage from '../pages/OrganizationSettingsPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import AdminCoworkingsPage from '../pages/AdminCoworkingsPage';
import AdminCoworkingCreatePage from '../pages/AdminCoworkingCreatePage';
import AdminCoworkingEditPage from '../pages/AdminCoworkingEditPage';
import AdminSpacesPage from '../pages/AdminSpacesPage';
import CoworkingMapPage from '../pages/CoworkingMapPage';
import CoworkingDetailsPage from '../pages/CoworkingDetailsPage';
import CoworkingFloorPage from '../pages/CoworkingFloorPage';
import SpaceDetailsPage from '../pages/SpaceDetailsPage';
import BookingPage from '../pages/BookingPage';
import BookingDetailsPage from '../pages/BookingDetailsPage';
import ProfilePage from '../pages/ProfilePage';
import NotFoundPage from '../pages/NotFoundPage';
import LoadingScreen from '../shared/components/LoadingScreen';

// Layout
import MainLayout from '../shared/layouts/MainLayout';
import AdminLayout from '../shared/layouts/AdminLayout';
import ProtectedRoute from '../shared/components/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry on authentication errors (401, 403)
        if (error instanceof Error && 
            (error as any).statusCode === 401 || 
            (error as any).statusCode === 403) {
          return false;
        }
        // Otherwise retry up to 3 times
        return failureCount < 3;
      },
    },
  },
});

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Check authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUserFromToken();
        setIsAuthenticated(!!currentUser);
        setUser(currentUser);
      } catch (error) {
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Initialize organization color
  useEffect(() => {
    const initOrganizationColor = async () => {
      try {
        const org = await getOrganization();
        document.documentElement.style.setProperty('--organization-color', org.primaryColor);
      } catch (error) {
        console.error('Failed to load organization settings:', error);
      }
    };
    
    if (isAuthenticated) {
      initOrganizationColor();
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {!isAuthenticated ? (
          <Routes>
            <Route path={ROUTES.LOGIN} element={<LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />} />
            <Route path={ROUTES.REGISTER} element={<RegisterPage onRegisterSuccess={() => setIsAuthenticated(true)} />} />
            <Route path="/tablet/:buildingId/:placeId" element={<TabletViewPage />} />
            <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
          </Routes>
        ) : (
          <Routes>
            <Route path={ROUTES.LOGIN} element={<Navigate to={ROUTES.HOME} replace />} />
            <Route path={ROUTES.REGISTER} element={<Navigate to={ROUTES.HOME} replace />} />
            
            <Route element={<MainLayout />}>
              <Route path={ROUTES.HOME} element={<HomePage />} />
              <Route path={ROUTES.COWORKING_DETAILS} element={<CoworkingDetailsPage />} />
              <Route path={ROUTES.SPACE_DETAILS} element={<SpaceDetailsPage />} />
              <Route path={ROUTES.BOOKING} element={<BookingPage />} />
              <Route path={ROUTES.BOOKING_DETAILS} element={<BookingDetailsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            
            {/* Fullscreen map pages without standard layout */}
            <Route path={ROUTES.COWORKING_MAP} element={<CoworkingMapPage />} />
            <Route path={ROUTES.COWORKING_FLOORS} element={<CoworkingFloorPage />} />
            
            <Route element={<AdminLayout />}>
              <Route path={ROUTES.ORGANIZATION_SETTINGS} element={
                <ProtectedRoute role="owner">
                  <OrganizationSettingsPage />
                </ProtectedRoute>
              } />
              <Route path={ROUTES.ADMIN_DASHBOARD} element={
                <ProtectedRoute role="admin">
                  <AdminDashboardPage />
                </ProtectedRoute>
              } />
              <Route path={ROUTES.ADMIN_SPACES} element={
                <ProtectedRoute role="admin">
                  <AdminSpacesPage />
                </ProtectedRoute>
              } />
              <Route path={ROUTES.ADMIN_COWORKINGS} element={
                <ProtectedRoute role="admin">
                  <AdminCoworkingsPage />
                </ProtectedRoute>
              } />
              <Route path={ROUTES.ADMIN_COWORKINGS + '/create'} element={
                <ProtectedRoute role="admin">
                  <AdminCoworkingCreatePage />
                </ProtectedRoute>
              } />
              <Route path={ROUTES.ADMIN_COWORKING_EDIT} element={
                <ProtectedRoute role="admin">
                  <AdminCoworkingEditPage />
                </ProtectedRoute>
              } />
            </Route>
            
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        )}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// Need to import this after the function to avoid circular dependency
import { getOrganization } from '../modules/admin/api/organizationApi';
import TabletViewPage from '../pages/TabletViewPage'

export default App;