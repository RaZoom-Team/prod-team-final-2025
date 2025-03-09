import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ROUTES } from '../config';
import { getOrganization } from '../modules/admin/api/organizationApi';

// Pages
import HomePage from '../pages/HomePage';
import OrganizationSettingsPage from '../pages/OrganizationSettingsPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import AdminSpacesPage from '../pages/AdminSpacesPage';
import AdminCoworkingsPage from '../pages/AdminCoworkingsPage';
import CoworkingDetailsPage from '../pages/CoworkingDetailsPage';
import SpaceDetailsPage from '../pages/SpaceDetailsPage';
import BookingPage from '../pages/BookingPage';
import NotFoundPage from '../pages/NotFoundPage';

// Layout
import MainLayout from '../shared/layouts/MainLayout';
import AdminLayout from '../shared/layouts/AdminLayout';
import ProtectedRoute from '../shared/components/ProtectedRoute';

function AppContent() {
  const location = useLocation();
  
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
    
    initOrganizationColor();
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path={ROUTES.HOME} element={<HomePage />} />
        <Route path={ROUTES.COWORKING_DETAILS} element={<CoworkingDetailsPage />} />
        <Route path={ROUTES.SPACE_DETAILS} element={<SpaceDetailsPage />} />
        <Route path={ROUTES.BOOKING} element={<BookingPage />} />
      </Route>
      
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
      </Route>
      
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppContent;