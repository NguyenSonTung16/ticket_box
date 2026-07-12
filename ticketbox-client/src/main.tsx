import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

import { EventPage } from './pages/EventPage';
import { SeatMapPage } from './pages/SeatMapPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { PaymentPage } from './pages/PaymentPage';
import { HomePage } from './pages/HomePage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { AuthProvider } from './context/AuthContext';



// Check-in & Bio Approval
import { CheckinConsolePage } from './pages/CheckinConsolePage';
import { BioApprovalPage } from './pages/BioApprovalPage';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/event.html" element={<EventPage />} />
            <Route path="/seat.html" element={<SeatMapPage />} />
            <Route path="/checkout.html" element={<CheckoutPage />} />
            <Route path="/payment.html" element={<PaymentPage />} />
            <Route path="/payment-success.html" element={<PaymentSuccessPage />} />
            
            {/* Check-in & Bio Approval */}
            <Route path="/checkin" element={<CheckinConsolePage />} />
            <Route path="/organizer/bio-approval" element={<BioApprovalPage />} />


          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </React.StrictMode>
  );
}
