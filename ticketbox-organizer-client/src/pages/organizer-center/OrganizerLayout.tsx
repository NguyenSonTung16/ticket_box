import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { OrganizerTopNav } from './components/OrganizerTopNav';
import { OrganizerSideNav } from './components/OrganizerSideNav';
import { useAuth } from '../../context/AuthContext';
import { LoginModal } from '../../components/LoginModal';

export const OrganizerLayout: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white bg-[url('https://images.unsplash.com/photo-1540039155732-61ee48151f8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        <LoginModal isOpen={true} onClose={() => {}} message="Vui lòng đăng nhập bằng tài khoản Organizer hoặc Staff" />
      </div>
    );
  }

  const location = useLocation();
  if (user.role === 'CHECKIN_STAFF' && (location.pathname === '/organizer' || location.pathname === '/organizer/')) {
    return <Navigate to="/organizer/checkin" replace />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <OrganizerTopNav />
      <OrganizerSideNav />
      <Outlet />
    </div>
  );
};
