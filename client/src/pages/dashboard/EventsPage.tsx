import { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';
import { useBadgeNotifications } from '../../hooks/useBadgeNotifications';
import { useAIFeedbackNotifications } from '../../hooks/useAIFeedbackNotifications';
import type { KarmaEvent, CreateKarmaEventDto } from '../../types';

interface EventFilters {
  period: 'week' | 'month' | 'year' | 'all';
  intensity: 'all' | 'positive' | 'neutral' | 'negative';
  feedback: 'all' | 'generated' | 'pending';
}

export const EventsPage = () => {
  const { showToast } = useToast();
  const { triggerBadgeCheck } = useBadgeNotifications();
  const { notifyEventCreated } = useAIFeedbackNotifications();
  const [events, setEvents] = useState<KarmaEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<KarmaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<EventFilters>({
    period: 'all',
    intensity: 'all',
    feedback: 'all'
  });
  const [formData, setFormData] = useState<CreateKarmaEventDto>({
    action: '',
    reflection: '',
    occurred_at: new Date().toISOString().split('T')[0]
  });

  const eventsPerPage = 10;
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * eventsPerPage,
    currentPage * eventsPerPage
  );

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, filters]);

  const fetchEvents = async (showRefreshLoading = false) => {
    try {
      if (showRefreshLoading) {
        setRefreshLoading(true);
      } else {
        setLoading(true);
      }
      const data = await apiClient.getMyKarmaEvents();
      setEvents(data.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()));
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Error Loading Events',
        message: err instanceof Error ? err.message : 'Failed to load events'
      });
    } finally {
      setLoading(false);
      setRefreshLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Period filter
    if (filters.period !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (filters.period) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(event => new Date(event.occurred_at) >= cutoffDate);
    }

    // Intensity filter
    if (filters.intensity !== 'all') {
      filtered = filtered.filter(event => {
        switch (filters.intensity) {
          case 'positive': return event.intensity >= 7;
          case 'neutral': return event.intensity >= 4 && event.intensity < 7;
          case 'negative': return event.intensity < 4;
          default: return true;
        }
      });
    }

    // Feedback filter
    if (filters.feedback !== 'all') {
      filtered = filtered.filter(event => {
        switch (filters.feedback) {
          case 'generated': return event.feedback_generated;
          case 'pending': return !event.feedback_generated;
          default: return true;
        }
      });
    }

    setFilteredEvents(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.action.trim()) return;

    try {
      setCreateLoading(true);
      const newEvent = await apiClient.createKarmaEvent({
        ...formData,
        occurred_at: formData.occurred_at ? new Date(formData.occurred_at).toISOString() : undefined
      });
      
      // Add new event to the beginning of the events array
      setEvents(prev => [newEvent, ...prev]);
      setFormData({ action: '', reflection: '', occurred_at: new Date().toISOString().split('T')[0] });
      setShowCreateForm(false);
      
      // Show success message
      showToast({
        type: 'success',
        title: 'Event Created!',
        message: 'Your karma event has been created and is being analyzed by AI.',
        duration: 4000
      });
      
      // Start monitoring this event for AI feedback completion
      notifyEventCreated(newEvent.event_id);
      
      // Check for new badges after creating an event
      triggerBadgeCheck();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Error Creating Event',
        message: err instanceof Error ? err.message : 'Failed to create event'
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 7) return 'text-green-600 bg-green-100';
    if (intensity >= 4) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getIntensityLabel = (intensity: number) => {
    if (intensity >= 7) return 'Positive';
    if (intensity >= 4) return 'Neutral';
    return 'Negative';
  };

  const getPeriodText = (period: string) => {
    switch (period) {
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      default: return 'All Time';
    }
  };

  const clearFilters = () => {
    setFilters({
      period: 'all',
      intensity: 'all',
      feedback: 'all'
    });
  };

  const hasActiveFilters = filters.period !== 'all' || filters.intensity !== 'all' || filters.feedback !== 'all';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Karma Events
        </h2>
        <div className="flex space-x-3">
          <button
            onClick={() => fetchEvents(true)}
            disabled={refreshLoading}
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
          >
            {refreshLoading && <LoadingSpinner size="sm" />}
            <span>{refreshLoading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            {showCreateForm ? 'Cancel' : 'Add Event'}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Karma Event</h3>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div>
              <label htmlFor="action" className="block text-sm font-medium text-gray-700 mb-1">
                Action *
              </label>
              <input
                type="text"
                id="action"
                required
                placeholder="What did you do? (e.g., Helped a stranger, Volunteered at shelter)"
                value={formData.action}
                onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="reflection" className="block text-sm font-medium text-gray-700 mb-1">
                Reflection
              </label>
              <textarea
                id="reflection"
                placeholder="How did this make you feel? Any thoughts or insights?"
                value={formData.reflection}
                onChange={(e) => setFormData({ ...formData, reflection: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="occurred_at" className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                id="occurred_at"
                value={formData.occurred_at}
                onChange={(e) => setFormData({ ...formData, occurred_at: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createLoading || !formData.action.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center space-x-2"
              >
                {createLoading && <LoadingSpinner size="sm" />}
                <span>{createLoading ? 'Creating...' : 'Create Event'}</span>
              </button>
            </div>
          </form>
          
          {/* AI Processing Note */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>AI Analysis:</strong> After creating your event, our AI will analyze it in the background to generate personalized feedback and assign an intensity score. This usually takes 30-60 seconds.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear All
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Period Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
            <select
              value={filters.period}
              onChange={(e) => setFilters({ ...filters, period: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>

          {/* Intensity Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Intensity</label>
            <select
              value={filters.intensity}
              onChange={(e) => setFilters({ ...filters, intensity: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Intensities</option>
              <option value="positive">Positive (7-10)</option>
              <option value="neutral">Neutral (4-6)</option>
              <option value="negative">Negative (0-3)</option>
            </select>
          </div>

          {/* Feedback Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">AI Feedback</label>
            <select
              value={filters.feedback}
              onChange={(e) => setFilters({ ...filters, feedback: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Events</option>
              <option value="generated">With Feedback</option>
              <option value="pending">Processing</option>
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.period !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {getPeriodText(filters.period)}
                <button
                  onClick={() => setFilters({ ...filters, period: 'all' })}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.intensity !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {filters.intensity.charAt(0).toUpperCase() + filters.intensity.slice(1)}
                <button
                  onClick={() => setFilters({ ...filters, intensity: 'all' })}
                  className="ml-2 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.feedback !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                {filters.feedback === 'generated' ? 'With Feedback' : 'Processing'}
                <button
                  onClick={() => setFilters({ ...filters, feedback: 'all' })}
                  className="ml-2 text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          Showing {paginatedEvents.length} of {filteredEvents.length} events
          {hasActiveFilters && ` (${events.length} total)`}
        </div>
        {totalPages > 1 && (
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
        )}
      </div>

      {/* Events List */}
      <div className="bg-white shadow rounded-lg mb-6">
        {loading ? (
          <div className="p-8 text-center">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600 mt-4">Loading your karma events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-8 text-center">
            {hasActiveFilters ? (
              <>
                <p className="text-gray-600">No events match your current filters.</p>
                <button
                  onClick={clearFilters}
                  className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear filters to see all events
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-600">No karma events yet.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Create your first event to start tracking your karma!
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {paginatedEvents.map((event) => (
              <div key={event.event_id} className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {event.action}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(event.occurred_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getIntensityColor(event.intensity)}`}>
                      {getIntensityLabel(event.intensity)} ({event.intensity}/10)
                    </span>
                  </div>
                </div>
                
                {event.reflection && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-700 italic">
                      "{event.reflection}"
                    </p>
                  </div>
                )}
                
                {event.feedback_generated && event.feedback ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-800">AI Feedback</p>
                        <p className="text-sm text-blue-700 mt-1">{event.feedback}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-5 h-5 flex items-center justify-center">
                          <LoadingSpinner size="sm" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-amber-800">AI Analysis in Progress</p>
                        <p className="text-sm text-amber-700 mt-1">
                          Our AI is analyzing your event to provide personalized feedback and assign an intensity score. This usually takes 30-60 seconds.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
          >
            Previous
          </button>
          
          <div className="flex space-x-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  page === currentPage
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};