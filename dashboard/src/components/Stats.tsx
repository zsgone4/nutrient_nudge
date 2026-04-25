import { DashboardStats } from '../api';

interface StatsProps {
  stats: DashboardStats;
}

export default function Stats({ stats }: StatsProps) {
  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: '👥',
      color: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: 'Users with Profile',
      value: stats.usersWithCompleteProfile,
      icon: '✓',
      color: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      label: 'Food Entries',
      value: stats.totalFoodEntries,
      icon: '🍽️',
      color: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      label: 'Foods in Database',
      value: stats.totalFoodsInDatabase,
      icon: '📚',
      color: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      label: 'Nutrient Scores',
      value: stats.totalNutrientScores,
      icon: '📊',
      color: 'bg-pink-50',
      textColor: 'text-pink-600',
    },
    {
      label: 'Avg Nutrient Score',
      value: `${stats.averageNutrientScore}/100`,
      icon: '⭐',
      color: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`${card.color} rounded-lg p-6 border border-gray-200`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{card.label}</p>
                <p className={`text-3xl font-bold ${card.textColor} mt-2`}>
                  {card.value}
                </p>
              </div>
              <div className="text-4xl">{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* User Distribution by Goal */}
      {Object.keys(stats.usersByGoal).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            User Distribution by Diet Goal
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(stats.usersByGoal).map(([goal, count]) => (
              <div key={goal} className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 capitalize">
                  {goal.replace(/_/g, ' ')}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
