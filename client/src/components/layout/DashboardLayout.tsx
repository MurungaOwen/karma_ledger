import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useBadgeNotifications } from '../../hooks/useBadgeNotifications';

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  // Initialize badge notifications
  useBadgeNotifications();

  const navigation = [
    { name: 'Overview', href: '/dashboard', current: location.pathname === '/dashboard' },
    { name: 'Karma Events', href: '/dashboard/events', current: location.pathname === '/dashboard/events' },
    { name: 'Leaderboard', href: '/dashboard/leaderboard', current: location.pathname === '/dashboard/leaderboard' },
    { name: 'Badges', href: '/dashboard/badges', current: location.pathname === '/dashboard/badges' },
    { name: 'Suggestions', href: '/dashboard/suggestions', current: location.pathname === '/dashboard/suggestions' },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Karma Ledger
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user?.username}!
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <nav className="flex space-x-8 mb-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  item.current
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
          
          <Outlet />
        </div>
      </div>
    </div>
  );
};
