import { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import type { Badge, UserBadge } from '../../types';

export const BadgesPage = () => {
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'earned' | 'available'>('earned');

  useEffect(() => {
    fetchBadgesData();
  }, []);

  const fetchBadgesData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [allBadgesData, earnedBadgesData] = await Promise.all([
        apiClient.getBadges(),
        apiClient.getMyBadges()
      ]);
      
      setAllBadges(allBadgesData);
      setEarnedBadges(earnedBadgesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load badges');
    } finally {
      setLoading(false);
    }
  };

  const isBadgeEarned = (badgeId: string) => {
    return earnedBadges.some(earned => earned.badge_id === badgeId);
  };

  // const getBadgeEarnedDate = (badgeId: string) => {
  //   const earned = earnedBadges.find(earned => earned.badge_id === badgeId);
  //   return earned ? new Date(earned.awarded_at) : null;
  // };

  // const getEarnedBadgeDetails = (badgeId: string) => {
  //   return earnedBadges.find(earned => earned.badge_id === badgeId);
  // };

  const getBadgeIcon = (icon: string) => {
    const iconMap: { [key: string]: string } = {
      'first-event': '🎯',
      'milestone-10': '🏆',
      'milestone-50': '🌟',
      'milestone-100': '💎',
      'top-10': '👑',
      'default': '🏅'
    };
    return iconMap[icon] || iconMap.default;
  };

  const getBadgeCategory = (code: string) => {
    if (code.includes('milestone')) return 'Milestone';
    if (code.includes('top')) return 'Achievement';
    if (code.includes('first')) return 'Getting Started';
    return 'General';
  };

  const getBadgeRarity = (code: string) => {
    if (code.includes('100')) return { level: 'Legendary', color: 'purple' };
    if (code.includes('50')) return { level: 'Epic', color: 'blue' };
    if (code.includes('10') || code.includes('top')) return { level: 'Rare', color: 'yellow' };
    if (code.includes('first')) return { level: 'Common', color: 'green' };
    return { level: 'Common', color: 'gray' };
  };

  const getRarityStyles = (color: string) => {
    const styles = {
      purple: 'bg-purple-100 text-purple-800 border-purple-300',
      blue: 'bg-blue-100 text-blue-800 border-blue-300',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      green: 'bg-green-100 text-green-800 border-green-300',
      gray: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return styles[color as keyof typeof styles] || styles.gray;
  };

  const getTimeSinceEarned = (earnedDate: Date) => {
    const now = new Date();
    const diff = now.getTime() - earnedDate.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  const earnedBadgesWithDetails = earnedBadges.map(earned => {
    const badgeInfo = allBadges.find(badge => badge.badge_id === earned.badge_id);
    return {
      ...earned,
      badge: badgeInfo || earned.badge
    };
  }).filter(earned => earned.badge);

  const availableBadges = allBadges.filter(badge => !isBadgeEarned(badge.badge_id));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchBadgesData} />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Badges & Achievements
        </h2>
        <div className="text-sm text-gray-600">
          {earnedBadges.length} of {allBadges.length} earned
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Progress</h3>
          <span className="text-2xl font-bold text-blue-600">
            {allBadges.length > 0 ? Math.round((earnedBadges.length / allBadges.length) * 100) : 0}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${allBadges.length > 0 ? (earnedBadges.length / allBadges.length) * 100 : 0}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Keep logging karma events to unlock more achievements!
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('earned')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'earned'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Earned Badges ({earnedBadges.length})
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'available'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Available Badges ({availableBadges.length})
          </button>
        </nav>
      </div>

      {/* Earned Badges Tab */}
      {activeTab === 'earned' && (
        <div>
          {earnedBadgesWithDetails.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-6xl mb-4">🏅</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Badges Earned Yet</h3>
              <p className="text-gray-600 mb-4">
                Start logging karma events to earn your first badge!
              </p>
              <button
                onClick={() => setActiveTab('available')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                View Available Badges
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {earnedBadgesWithDetails
                .sort((a, b) => new Date(b.awarded_at).getTime() - new Date(a.awarded_at).getTime())
                .map((earned) => {
                  const rarity = getBadgeRarity(earned.badge!.code);
                  const earnedDate = new Date(earned.awarded_at);
                  
                  return (
                    <div
                      key={earned.user_badge_id}
                      className="bg-white rounded-lg shadow-md border border-green-200 hover:shadow-lg transition-shadow"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="text-4xl">{getBadgeIcon(earned.badge!.icon)}</div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRarityStyles(rarity.color)}`}>
                              {rarity.level}
                            </span>
                            <div className="text-green-600">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {earned.badge!.name}
                        </h3>
                        
                        <p className="text-sm text-gray-600 mb-4">
                          {earned.badge!.description}
                        </p>
                        
                        <div className="border-t border-gray-200 pt-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Category:</span>
                            <span className="text-gray-700 font-medium">
                              {getBadgeCategory(earned.badge!.code)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm mt-2">
                            <span className="text-gray-500">Earned:</span>
                            <span className="text-green-600 font-medium">
                              {getTimeSinceEarned(earnedDate)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm mt-2">
                            <span className="text-gray-500">Date:</span>
                            <span className="text-gray-700">
                              {earnedDate.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Available Badges Tab */}
      {activeTab === 'available' && (
        <div>
          {availableBadges.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">All Badges Earned!</h3>
              <p className="text-gray-600">
                Congratulations! You've earned all available badges in the system.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableBadges.map((badge) => {
                const rarity = getBadgeRarity(badge.code);
                
                return (
                  <div
                    key={badge.badge_id}
                    className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow opacity-75"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="text-4xl grayscale">{getBadgeIcon(badge.icon)}</div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRarityStyles(rarity.color)}`}>
                            {rarity.level}
                          </span>
                          <div className="text-gray-400">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        {badge.name}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-4">
                        {badge.description}
                      </p>
                      
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Category:</span>
                          <span className="text-gray-700 font-medium">
                            {getBadgeCategory(badge.code)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2">
                          <span className="text-gray-500">Status:</span>
                          <span className="text-orange-600 font-medium">
                            Not Earned
                          </span>
                        </div>
                        
                        {/* Progress hints */}
                        <div className="mt-4 bg-blue-50 rounded-lg p-3">
                          <p className="text-xs text-blue-700">
                            💡 <strong>How to earn:</strong> {' '}
                            {badge.code.includes('first') && 'Log your first karma event'}
                            {badge.code.includes('milestone-10') && 'Complete 10 karma events'}
                            {badge.code.includes('milestone-50') && 'Complete 50 karma events'}
                            {badge.code.includes('milestone-100') && 'Complete 100 karma events'}
                            {badge.code.includes('top-10') && 'Rank in the top 10 weekly leaderboard'}
                            {!badge.code.includes('first') && !badge.code.includes('milestone') && !badge.code.includes('top') && 'Keep logging karma events'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};