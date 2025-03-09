import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import MobileBottomBar from '../components/MobileBottomBar';

const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow p-4 md:p-6 max-w-full overflow-hidden">
        <Outlet />
      </main>
      <MobileBottomBar />
    </div>
  );
};

export default AdminLayout;