import { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';
import type { Suggestion } from '../../types';

interface SuggestionFilters {
  period: 'week' | 'month' | 'year' | 'all';
  status: 'all' | 'used' | 'unused';
  sortBy: 'newest' | 'oldest' | 'week';
}

export const SuggestionsPage = () => {
  const { showToast } = useToast();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<SuggestionFilters>({
    period: 'all',
    status: 'all',
    sortBy: 'newest'
  });

  const suggestionsPerPage = 8;
  const totalPages = Math.ceil(filteredSuggestions.length / suggestionsPerPage);
  const paginatedSuggestions = filteredSuggestions.slice(
    (currentPage - 1) * suggestionsPerPage,
    currentPage * suggestionsPerPage
  );

  useEffect(() => {
    fetchSuggestions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [suggestions, filters]);

  const fetchSuggestions = async (showRefreshLoading = false) => {
    try {
      if (showRefreshLoading) {
        setRefreshLoading(true);
      } else {
        setLoading(true);
      }
      const data = await apiClient.getSuggestions();
      setSuggestions(data);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Error Loading Suggestions',
        message: err instanceof Error ? err.message : 'Failed to load suggestions'
      });
    } finally {
      setLoading(false);
      setRefreshLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...suggestions];

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
      
      filtered = filtered.filter(suggestion => new Date(suggestion.created_at) >= cutoffDate);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(suggestion => {
        switch (filters.status) {
          case 'used': return suggestion.used;
          case 'unused': return !suggestion.used;
          default: return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'week':
          return b.week - a.week;
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredSuggestions(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleTriggerSuggestions = async () => {
    try {
      setTriggerLoading(true);
      
      // Store current suggestion count to detect changes
      const currentSuggestionCount = suggestions.length;
      const currentSuggestionTexts = suggestions.map(s => s.suggestion_text);
      
      await apiClient.triggerSuggestions();
      
      // Poll for new suggestions with better timing
      let attempts = 0;
      const maxAttempts = 15; // 30 seconds total wait time
      let foundNewSuggestions = false;
      
      while (attempts < maxAttempts && !foundNewSuggestions) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          const newSuggestions = await apiClient.getSuggestions();
          
          // Check if suggestions actually changed (not just count)
          const newSuggestionTexts = newSuggestions.map(s => s.suggestion_text);
          const hasNewContent = newSuggestionTexts.some(text => 
            !currentSuggestionTexts.includes(text)
          );
          
          if (hasNewContent || newSuggestions.length !== currentSuggestionCount) {
            setSuggestions(newSuggestions);
            foundNewSuggestions = true;
            showToast({
              type: 'success',
              title: 'New Suggestions Generated!',
              message: 'Fresh AI suggestions have been created based on your recent karma activity.',
              duration: 5000
            });
          }
          
        } catch (fetchErr) {
          console.error('Error fetching updated suggestions:', fetchErr);
        }
        
        attempts++;
      }
      
      if (!foundNewSuggestions) {
        showToast({
          type: 'warning',
          title: 'No New Suggestions',
          message: 'Generation completed, but no new suggestions were found. This might happen if your recent karma activity is similar to previous weeks.',
          duration: 6000
        });
        // Still refresh to show any updates
        fetchSuggestions();
      }
      
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Error Generating Suggestions',
        message: err instanceof Error ? err.message : 'Failed to trigger suggestions'
      });
    } finally {
      setTriggerLoading(false);
    }
  };

  const handleMarkAsUsed = async (suggestionId: string) => {
    try {
      // Optimistically update the UI
      setSuggestions(prev => prev.map(s => 
        s.id === suggestionId ? { ...s, used: true } : s
      ));
      
      // Make API call to mark as used
      // await apiClient.markAsUsed(suggestionId);
    } catch (err) {
      // Revert optimistic update on error
      setSuggestions(prev => prev.map(s => 
        s.id === suggestionId ? { ...s, used: false } : s
      ));
      showToast({
        type: 'error',
        title: 'Error Marking Suggestion',
        message: err instanceof Error ? err.message : 'Failed to mark suggestion as used'
      });
    }
  };

  const getWeekText = (week: number) => {
    if (week === 1) return '1st week';
    if (week === 2) return '2nd week';
    if (week === 3) return '3rd week';
    return `${week}th week`;
  };

  const getTimeSinceCreated = (createdAt: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(createdAt).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  const getPeriodText = (period: string) => {
    switch (period) {
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      default: return 'All Time';
    }
  };

  const getSortText = (sort: string) => {
    switch (sort) {
      case 'oldest': return 'Oldest First';
      case 'week': return 'By Week';
      case 'newest':
      default: return 'Newest First';
    }
  };

  const clearFilters = () => {
    setFilters({
      period: 'all',
      status: 'all',
      sortBy: 'newest'
    });
  };

  const hasActiveFilters = filters.period !== 'all' || filters.status !== 'all' || filters.sortBy !== 'newest';

  const groupedSuggestions = paginatedSuggestions.reduce((acc, suggestion) => {
    const week = suggestion.week;
    if (!acc[week]) acc[week] = [];
    acc[week].push(suggestion);
    return acc;
  }, {} as { [week: number]: Suggestion[] });

  const sortedWeeks = Object.keys(groupedSuggestions).sort((a, b) => {
    if (filters.sortBy === 'week') {
      return parseInt(b) - parseInt(a);
    }
    return parseInt(b) - parseInt(a);
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          AI Suggestions
        </h2>
        <div className="flex space-x-3">
          <button
            onClick={() => fetchSuggestions(true)}
            disabled={refreshLoading}
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
          >
            {refreshLoading && <LoadingSpinner size="sm" />}
            <span>{refreshLoading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button
            onClick={handleTriggerSuggestions}
            disabled={triggerLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
          >
            {triggerLoading && <LoadingSpinner size="sm" />}
            <span>{triggerLoading ? 'Generating...' : 'Generate New Suggestions'}</span>
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              About AI Suggestions
            </h3>
            <div className="mt-1 text-sm text-blue-700">
              <p>
                Our AI analyzes your weekly karma patterns and generates personalized suggestions to help you grow. 
                Suggestions are based on your recent activities and karma intensity trends.
              </p>
              <p className="mt-2">
                <strong>Note:</strong> New suggestions are generated based on your current week's karma activity. 
                If you haven't had much activity recently, you might see similar suggestions.
              </p>
            </div>
          </div>
        </div>
      </div>

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

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Suggestions</option>
              <option value="used">Used</option>
              <option value="unused">Not Used</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="week">By Week</option>
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
            {filters.status !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {filters.status === 'used' ? 'Used' : 'Not Used'}
                <button
                  onClick={() => setFilters({ ...filters, status: 'all' })}
                  className="ml-2 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.sortBy !== 'newest' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                {getSortText(filters.sortBy)}
                <button
                  onClick={() => setFilters({ ...filters, sortBy: 'newest' })}
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
          Showing {paginatedSuggestions.length} of {filteredSuggestions.length} suggestions
          {hasActiveFilters && ` (${suggestions.length} total)`}
        </div>
        {totalPages > 1 && (
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
        )}
      </div>

      {/* Suggestions List */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 mt-4">Loading your AI suggestions...</p>
        </div>
      ) : filteredSuggestions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          {hasActiveFilters ? (
            <>
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Suggestions Found</h3>
              <p className="text-gray-600 mb-4">
                No suggestions match your current filters.
              </p>
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear filters to see all suggestions
              </button>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Suggestions Yet</h3>
              <p className="text-gray-600 mb-4">
                Start logging karma events to receive personalized AI suggestions for your growth.
              </p>
              <button
                onClick={handleTriggerSuggestions}
                disabled={triggerLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
              >
                {triggerLoading && <LoadingSpinner size="sm" />}
                <span>{triggerLoading ? 'Generating...' : 'Generate First Suggestions'}</span>
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {sortedWeeks.map((week) => (
            <div key={week} className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Week {week} Suggestions
                </h3>
                <p className="text-sm text-gray-600">
                  {getWeekText(parseInt(week))} since joining
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedSuggestions[parseInt(week)].map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className={`p-4 rounded-lg border transition-all duration-200 ${
                        suggestion.used
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="text-2xl">💡</div>
                          <div className="text-sm text-gray-600">
                            {getTimeSinceCreated(suggestion.created_at)}
                          </div>
                        </div>
                        {suggestion.used && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Used
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-900 leading-relaxed mb-4">
                        {suggestion.suggestion_text}
                      </p>
                      
                      {!suggestion.used && (
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600">
                            Mark as used when implemented
                          </p>
                          <button
                            onClick={() => handleMarkAsUsed(suggestion.id)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Mark as Used
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
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