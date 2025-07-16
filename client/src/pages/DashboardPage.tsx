import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { DashboardOverview } from './dashboard/DashboardOverview';
import { EventsPage } from './dashboard/EventsPage';
import { LeaderboardPage } from './dashboard/LeaderboardPage';
import { BadgesPage } from './dashboard/BadgesPage';
import { SuggestionsPage } from './dashboard/SuggestionsPage';

export const DashboardPage: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<DashboardOverview />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="badges" element={<BadgesPage />} />
        <Route path="suggestions" element={<SuggestionsPage />} />
      </Route>
    </Routes>
  );
};