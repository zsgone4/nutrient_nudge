import { useState, useEffect } from 'react';
import { DashboardUser, dashboardAPI } from '../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface UserDetailModalProps {
  user: DashboardUser;
  isOpen: boolean;
  onClose: () => void;
}

interface NutrientScoreHistory {
  date: string;
  score: number;
  micronutrients: Record<string, number>;
}

export default function UserDetailModal({ user, isOpen, onClose }: UserDetailModalProps) {
  const [nutrientHistory, setNutrientHistory] = useState<NutrientScoreHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNutrientHistory();
    }
  }, [isOpen, user.id]);

  const loadNutrientHistory = async () => {
    try {
      setLoading(true);
      const data = await dashboardAPI.getNutrientScoreHistory(user.id, 30);
      setNutrientHistory(data.scores || []);
    } catch (err) {
      console.error('Failed to load nutrient history:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          {/* User Profile Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-lg font-semibold text-gray-900">{user.email}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Age</p>
                <p className="text-lg font-semibold text-gray-900">{user.age} years old</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Gender</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">{user.gender}</p>
              </div>
            </div>

            <div className="space-y-4">
              {user.profile && (
                <>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-blue-600 font-medium">Height</p>
                    <p className="text-lg font-semibold text-blue-900">{user.profile.height} cm</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="text-sm text-green-600 font-medium">Weight</p>
                    <p className="text-lg font-semibold text-green-900">{user.profile.weight} kg</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <p className="text-sm text-purple-600 font-medium">Activity Level</p>
                    <p className="text-lg font-semibold text-purple-900 capitalize">
                      {user.profile.activityLevel.replace(/_/g, ' ')}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Goals */}
          {user.goals && user.goals.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">User Goals</h3>
              <div className="flex flex-wrap gap-2">
                {user.goals.map((goal, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium"
                  >
                    {goal}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Diet Goal */}
          {user.profile && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Diet Goal</h3>
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {user.profile.goal.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
          )}

          {/* Nutrient Score History Chart */}
          {nutrientHistory.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Nutrient Score History</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={nutrientHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      labelFormatter={(label) => formatDate(label)}
                      formatter={(value) => `${value}/100`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6' }}
                      name="Nutrient Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Latest Nutrient Score Details */}
          {user.latestNutrientScore && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest Nutrient Score Details</h3>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-gray-600">Score (Date: {user.latestNutrientScore.date})</p>
                    <p className="text-4xl font-bold text-blue-600">{user.latestNutrientScore.score}/100</p>
                  </div>
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <p className="text-white text-3xl font-bold">{user.latestNutrientScore.score}</p>
                  </div>
                </div>

                {/* Micronutrient Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
                  {Object.entries(user.latestNutrientScore.micronutrients)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 12)
                    .map(([nutrient, percentage]) => (
                      <div key={nutrient} className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1 capitalize">
                          {nutrient.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              percentage >= 100
                                ? 'bg-green-500'
                                : percentage >= 75
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs font-semibold text-gray-700 mt-1">
                          {Math.round(percentage)}%
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Food Entries Info */}
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <p className="text-sm text-orange-600 font-medium">Food Entries Logged</p>
            <p className="text-2xl font-bold text-orange-900">{user.foodEntries.total} entries</p>
            <p className="text-xs text-orange-700 mt-2">
              Across {user.foodEntries.dates.length} different dates
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
