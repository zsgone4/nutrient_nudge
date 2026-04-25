import { useState, useEffect } from 'react';
import { dashboardAPI, DashboardStats, DashboardUser } from './api';
import Stats from './components/Stats';
import UsersTable from './components/UsersTable';
import UserDetailModal from './components/UserDetailModal';
import './App.css';

export default function App() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<DashboardUser | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsData, usersData] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getUsers(),
      ]);

      setStats(statsData);
      setUsers(usersData.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (user: DashboardUser) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">VibCode Dashboard</h1>
            <button
              onClick={loadDashboard}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* Stats Section */}
            {stats && <Stats stats={stats} />}

            {/* Users Table */}
            <div className="mt-8">
              <UsersTable 
                users={users} 
                onViewDetails={handleViewDetails}
                isLoading={loading}
              />
            </div>
          </>
        )}
      </main>

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}
