import { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { useAuth } from '../../hooks/useAuth';

interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
}

export const LeaderboardPage = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userScores, setUserScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [leaderboardData, scoresData] = await Promise.all([
        apiClient.getLeaderboard(),
        apiClient.getKarmaScores()
      ]);
      
      setLeaderboard(leaderboardData);
      setUserScores(scoresData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchLeaderboardData();
    } finally {
      setRefreshing(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      case 4: return '🎖️';
      case 5: return '🏅';
      default: return '🏆';
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { text: '1st Place', color: 'bg-yellow-500 text-white' };
    if (rank === 2) return { text: '2nd Place', color: 'bg-gray-400 text-white' };
    if (rank === 3) return { text: '3rd Place', color: 'bg-amber-600 text-white' };
    if (rank <= 5) return { text: 'Top 5', color: 'bg-blue-500 text-white' };
    if (rank <= 10) return { text: 'Top 10', color: 'bg-green-500 text-white' };
    return { text: `#${rank}`, color: 'bg-gray-500 text-white' };
  };

  const getCurrentUserRank = () => {
    if (!user) return null;
    const userIndex = leaderboard.findIndex(entry => entry.userId === user.user_id);
    return userIndex !== -1 ? userIndex + 1 : null;
  };

  const getCurrentUserScore = () => {
    if (!user) return null;
    const userEntry = leaderboard.find(entry => entry.userId === user.user_id);
    return userEntry ? userEntry.score : null;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-lime-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 80) return 'bg-green-500';
    if (score >= 70) return 'bg-lime-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  };

  const getPerformanceText = (score: number) => {
    if (score >= 90) return 'Exceptional';
    if (score >= 80) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Average';
    if (score >= 50) return 'Below Average';
    return 'Needs Improvement';
  };

  const getWeeklyTrend = () => {
    if (userScores.length < 2) return null;
    const latest = parseInt(userScores[userScores.length - 1].score);
    const previous = parseInt(userScores[userScores.length - 2].score);
    const diff = latest - previous;
    
    if (diff > 0) return { trend: 'up', value: diff, color: 'text-green-600' };
    if (diff < 0) return { trend: 'down', value: Math.abs(diff), color: 'text-red-600' };
    return { trend: 'same', value: 0, color: 'text-gray-600' };
  };

  const userRank = getCurrentUserRank();
  const userScore = getCurrentUserScore();
  const weeklyTrend = getWeeklyTrend();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchLeaderboardData} />;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Weekly Leaderboard
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Rankings based on average karma scores for the current week
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2"
        >
          {refreshing ? <LoadingSpinner size="sm" /> : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* User Performance Overview */}
      {userRank && userScore !== null && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Current Position */}
          <div className="bg-white rounded-lg shadow border border-blue-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Your Position</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-3xl">{getRankIcon(userRank)}</span>
                  <span className="text-2xl font-bold text-blue-600">#{userRank}</span>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRankBadge(userRank).color}`}>
                {getRankBadge(userRank).text}
              </div>
            </div>
          </div>

          {/* Current Score */}
          <div className="bg-white rounded-lg shadow border border-green-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Your Score</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`text-2xl font-bold ${getScoreColor(userScore)}`}>
                    {userScore}%
                  </span>
                  <span className={`text-lg font-bold ${getScoreColor(userScore)}`}>
                    ({getScoreGrade(userScore)})
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Performance</p>
                <p className={`text-sm font-medium ${getScoreColor(userScore)}`}>
                  {getPerformanceText(userScore)}
                </p>
              </div>
            </div>
          </div>

          {/* Weekly Trend */}
          <div className="bg-white rounded-lg shadow border border-purple-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Weekly Trend</p>
                <div className="flex items-center space-x-2 mt-2">
                  {weeklyTrend ? (
                    <>
                      <span className="text-2xl">
                        {weeklyTrend.trend === 'up' ? '📈' : weeklyTrend.trend === 'down' ? '📉' : '📊'}
                      </span>
                      <span className={`text-lg font-bold ${weeklyTrend.color}`}>
                        {weeklyTrend.trend === 'same' ? 'No Change' : `${weeklyTrend.trend === 'up' ? '+' : '-'}${weeklyTrend.value}%`}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-500">Not enough data</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">🏆 Top 3 Champions 🏆</h3>
          <div className="flex justify-center items-end space-x-2 sm:space-x-4">
            {/* 2nd Place */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center mb-2">
                <span className="text-2xl">🥈</span>
              </div>
              <div className="bg-gray-100 rounded-lg p-2 sm:p-4 w-24 sm:w-32">
                <p className="font-semibold text-gray-900 truncate">{leaderboard[1].username}</p>
                <p className="text-sm text-gray-600">{leaderboard[1].score}%</p>
                <p className="text-xs text-gray-500">#2</p>
              </div>
            </div>

            {/* 1st Place */}
            <div className="text-center">
              <div className="w-24 h-24 bg-yellow-300 rounded-full flex items-center justify-center mb-2 border-4 border-yellow-500">
                <span className="text-3xl">🥇</span>
              </div>
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-2 sm:p-4 w-28 sm:w-36">
                <p className="font-bold text-yellow-900 truncate">{leaderboard[0].username}</p>
                <p className="text-sm text-yellow-700">{leaderboard[0].score}%</p>
                <p className="text-xs text-yellow-600">👑 CHAMPION</p>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-300 rounded-full flex items-center justify-center mb-2">
                <span className="text-2xl">🥉</span>
              </div>
              <div className="bg-amber-50 rounded-lg p-2 sm:p-4 w-24 sm:w-32">
                <p className="font-semibold text-amber-900 truncate">{leaderboard[2].username}</p>
                <p className="text-sm text-amber-700">{leaderboard[2].score}%</p>
                <p className="text-xs text-amber-600">#3</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 + Current User Leaderboard */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Top Performers & Your Position</h3>
            <div className="text-sm text-gray-600">
              {leaderboard.length} {leaderboard.length === 1 ? 'participant' : 'participants'}
            </div>
          </div>
        </div>
        
        {leaderboard.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Leaderboard Data</h3>
            <p className="text-gray-600">
              The leaderboard will populate as users log karma events throughout the week.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {/* Top 3 Performers */}
            {leaderboard.slice(0, 3).map((entry, index) => {
              const rank = index + 1;
              const isCurrentUser = user?.user_id === entry.userId;
              const rankBadge = getRankBadge(rank);
              
              return (
                <div
                  key={entry.userId}
                  className={`p-6 transition-all duration-200 ${
                    isCurrentUser ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100">
                        <span className="text-2xl">{getRankIcon(rank)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className={`text-base sm:text-lg font-semibold ${
                            isCurrentUser ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {entry.username}
                          </h3>
                          {isCurrentUser && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${rankBadge.color}`}>
                            {rankBadge.text}
                          </span>
                          <span className="text-xs sm:text-sm text-gray-500">
                            {getPerformanceText(entry.score)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center sm:block">
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <span className={`text-xl sm:text-2xl font-bold ${getScoreColor(entry.score)}`}>
                            {entry.score}%
                          </span>
                          <span className={`text-base sm:text-lg font-bold ${getScoreColor(entry.score)}`}>
                            ({getScoreGrade(entry.score)})
                          </span>
                        </div>
                        <div className="w-20 sm:w-24 bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${getScoreBarColor(entry.score)}`}
                            style={{ width: `${entry.score}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Current User Position (if not in top 3) */}
            {userRank && userRank > 3 && (
              <>
                {/* Separator */}
                <div className="px-6 py-3 bg-gray-100 border-t border-gray-200">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="h-px bg-gray-300 flex-1"></div>
                    <span className="text-sm text-gray-500 px-3">
                      {userRank > 4 ? `${userRank - 3} other${userRank - 3 === 1 ? '' : 's'} between` : ''}
                    </span>
                    <div className="h-px bg-gray-300 flex-1"></div>
                  </div>
                </div>
                
                {/* Current User Entry */}
                {(() => {
                  const currentUserEntry = leaderboard.find(entry => entry.userId === user?.user_id);
                  if (!currentUserEntry) return null;
                  
                  const rankBadge = getRankBadge(userRank);
                  
                  return (
                    <div className="p-6 bg-blue-50 border-l-4 border-blue-500">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
                            <span className="text-2xl">{getRankIcon(userRank)}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base sm:text-lg font-semibold text-blue-900">
                                {currentUserEntry.username}
                              </h3>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                You
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${rankBadge.color}`}>
                                {rankBadge.text}
                              </span>
                              <span className="text-xs sm:text-sm text-gray-500">
                                {getPerformanceText(currentUserEntry.score)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center sm:block">
                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              <span className={`text-xl sm:text-2xl font-bold ${getScoreColor(currentUserEntry.score)}`}>
                                {currentUserEntry.score}%
                              </span>
                              <span className={`text-base sm:text-lg font-bold ${getScoreColor(currentUserEntry.score)}`}>
                                ({getScoreGrade(currentUserEntry.score)})
                              </span>
                            </div>
                            <div className="w-20 sm:w-24 bg-gray-200 rounded-full h-2 mt-1">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${getScoreBarColor(currentUserEntry.score)}`}
                                style={{ width: `${currentUserEntry.score}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}
      </div>

      {/* Weekly Progress Chart */}
      {userScores.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Weekly Progress Journey</h3>
          <div className="space-y-3">
            {userScores.map((weekScore, index) => {
              const score = parseInt(weekScore.score);
              const isLatest = index === userScores.length - 1;
              
              return (
                <div key={index} className={`flex items-center justify-between py-3 px-4 rounded-lg ${
                  isLatest ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isLatest ? 'text-blue-900' : 'text-gray-600'}`}>
                      Week {weekScore.week}
                    </span>
                    {isLatest && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="w-20 sm:w-32 bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${getScoreBarColor(score)}`}
                        style={{ width: `${score}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                      <span className={`text-sm font-bold ${getScoreColor(score)}`}>
                        {score}%
                      </span>
                      <span className={`text-xs font-medium ${getScoreColor(score)}`}>
                        ({getScoreGrade(score)})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};