import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import type { KarmaEvent, UserBadge } from '../../types';

export const DashboardOverview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [karmaScore, setKarmaScore] = useState<string>('--');
  const [totalEvents, setTotalEvents] = useState<number>(0);
  const [badgesCount, setBadgesCount] = useState<number>(0);
  const [recentEvents, setRecentEvents] = useState<KarmaEvent[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [scoreData, eventsData, badgesData] = await Promise.all([
        apiClient.getMyKarmaScore(),
        apiClient.getMyKarmaEvents(),
        apiClient.getMyBadges()
      ]);

      setKarmaScore(scoreData.total_percentage);
      setTotalEvents(eventsData.length);
      setBadgesCount(badgesData.length);
      setRecentEvents(eventsData.slice(0, 5));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchDashboardData} />;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Dashboard Overview
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Karma Score
          </h3>
          <p className="text-3xl font-bold text-blue-600 mb-2">
            {karmaScore}
          </p>
          <p className="text-gray-600">
            Your current karma percentage
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Total Events
          </h3>
          <p className="text-3xl font-bold text-green-600 mb-2">
            {totalEvents}
          </p>
          <p className="text-gray-600">
            Karma events logged
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Badges Earned
          </h3>
          <p className="text-3xl font-bold text-purple-600 mb-2">
            {badgesCount}
          </p>
          <p className="text-gray-600">
            Achievements unlocked
          </p>
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Events
          </h3>
          {recentEvents.length === 0 ? (
            <p className="text-gray-600">No recent events to display</p>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <div key={event.event_id} className="border-b border-gray-100 pb-3 last:border-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{event.action}</p>
                      {event.reflection && (
                        <p className="text-sm text-gray-600 mt-1">{event.reflection}</p>
                      )}
                      {event.feedback_generated && event.feedback && (
                        <p className="text-sm text-blue-600 mt-1">AI: {event.feedback}</p>
                      )}
                    </div>
                    <div className="ml-4 flex flex-col items-end">
                      <span className={`text-sm font-medium ${
                        event.intensity >= 7 ? 'text-green-600' : 
                        event.intensity >= 4 ? 'text-yellow-600' : 
                        'text-red-600'
                      }`}>
                        Intensity: {event.intensity}/10
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        {new Date(event.occurred_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <button 
              onClick={() => navigate('/dashboard/events')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
            >
              Add Karma Event
            </button>
            <button 
              onClick={() => navigate('/dashboard/suggestions')}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
            >
              View Suggestions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};