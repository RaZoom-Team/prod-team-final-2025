import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import MobileBottomBar from '../components/MobileBottomBar';

const MainLayout: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Only show header on home page for mobile and always on desktop */}
      <Header />
      
      <main className={`flex-grow ${isHomePage ? 'container mx-auto px-4 py-6' : 'container mx-auto px-4 py-6'}`}>
        <Outlet />
      </main>
      
      {/* Mobile bottom navigation */}
      <MobileBottomBar />
    </div>
  );
};

export default MainLayout;