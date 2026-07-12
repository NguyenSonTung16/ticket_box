import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

import { EventPage } from './pages/EventPage';

// Removed unused pages
import { AuthProvider } from './context/AuthContext';

// Organizer Center
import { OrganizerLayout } from './pages/organizer-center/OrganizerLayout';
import { OrganizerDashboard } from './pages/organizer-center/Dashboard';
import { FilesPage } from './pages/organizer-center/FilesPage';
import { CreateStep1 } from './pages/organizer-center/CreateStep1';
import { CreateStep2 } from './pages/organizer-center/CreateStep2';
import { CreateStep3 } from './pages/organizer-center/CreateStep3';
import { CreateStep4 } from './pages/organizer-center/CreateStep4';
import { ArtistBiographyPage } from './pages/organizer-center/ArtistBiographyPage';
import { ArtistBioListPage } from './pages/organizer-center/ArtistBioListPage';
import { ArtistBioManualPage } from './pages/organizer-center/ArtistBioManualPage';
import { StatsPage } from './pages/organizer-center/StatsPage';
import { OrganizerCheckinHistoryPage } from './pages/organizer-center/OrganizerCheckinHistoryPage';

import { CheckinConsolePage } from './pages/CheckinConsolePage';
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/organizer" replace />} />
            <Route path="/event.html" element={<EventPage />} />
            <Route path="/organizer" element={<OrganizerLayout />}>
              <Route index element={<OrganizerDashboard />} />
              <Route path="files" element={<FilesPage />} />
              <Route path="create/step-1" element={<CreateStep1 />} />
              <Route path="create/step-2" element={<CreateStep2 />} />
              <Route path="create/step-3" element={<CreateStep3 />} />
              <Route path="create/step-4" element={<CreateStep4 />} />
              <Route path="bio" element={<ArtistBiographyPage />} />
              <Route path="bio-manual" element={<ArtistBioManualPage />} />
              <Route path="artists" element={<ArtistBioListPage />} />
              <Route path="stats/:id" element={<StatsPage />} />
              <Route path="checkin-history" element={<OrganizerCheckinHistoryPage />} />
              <Route path="checkin" element={<CheckinConsolePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </React.StrictMode>
  );
}
