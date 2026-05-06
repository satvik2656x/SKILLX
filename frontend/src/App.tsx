import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppLayout from './components/AppLayout';

import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import SkillsPage from './pages/SkillsPage';
import SkillDetailPage from './pages/SkillDetailPage';
import RequestsPage from './pages/RequestsPage';
import SessionPage from './pages/SessionPage';
import SessionsPage from './pages/SessionsPage';
import RatingPage from './pages/RatingPage';
import RatingsPage from './pages/RatingsPage';
import DisputesPage from './pages/DisputesPage';
import WalletPage from './pages/WalletPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import VideoLibraryPage from './pages/VideoLibraryPage';
import MyVideosPage from './pages/MyVideosPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />

          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/skills" element={<SkillsPage />} />
            <Route path="/skills/:id" element={<SkillDetailPage />} />
            <Route path="/requests" element={<RequestsPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/session/:id" element={<SessionPage />} />
            <Route path="/rate/:sessionId" element={<RatingPage />} />
            <Route path="/ratings" element={<RatingsPage />} />
            <Route path="/disputes" element={<DisputesPage />} />
            <Route path="/dispute/:transactionId" element={<DisputesPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/videos" element={<VideoLibraryPage />} />
            <Route path="/my-videos" element={<MyVideosPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
