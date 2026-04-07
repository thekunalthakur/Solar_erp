import React from 'react';
import { MdPeople, MdAttachMoney, MdBuild, MdTrendingUp } from 'react-icons/md';

const Dashboard = () => {
  const cards = [
    {
      title: 'Total Leads',
      value: '150',
      icon: <MdPeople size={32} />,
      color: 'text-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
    },
    {
      title: 'Sales This Month',
      value: '$45,000',
      icon: <MdAttachMoney size={32} />,
      color: 'text-green-600',
      bgGradient: 'from-green-50 to-green-100',
    },
    {
      title: 'Installations',
      value: '23',
      icon: <MdBuild size={32} />,
      color: 'text-orange-600',
      bgGradient: 'from-orange-50 to-orange-100',
    },
    {
      title: 'Revenue',
      value: '$120,000',
      icon: <MdTrendingUp size={32} />,
      color: 'text-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
      <p className="text-gray-600 mb-8">Welcome to your solar ERP system</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`bg-gradient-to-br ${card.bgGradient} rounded-xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer`}
          >
            {/* Header with icon and title */}
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg bg-white shadow-sm ${card.color}`}>
                {card.icon}
              </div>
              <span className="text-sm font-medium text-gray-600">{card.title}</span>
            </div>

            {/* Value */}
            <h3 className="text-2xl font-bold text-gray-900">{card.value}</h3>

            {/* Footer badge */}
            <div className="mt-4 pt-4 border-t border-opacity-20 border-gray-300">
              <p className="text-xs text-gray-600">+12% from last month</p>
            </div>
          </div>
        ))}
      </div>

      {/* Additional info section */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[
              { text: 'New lead: John Doe from New York', time: '2 hours ago' },
              { text: 'Proposal sent to Jane Smith', time: '4 hours ago' },
              { text: 'Installation scheduled for Bob Johnson', time: '1 day ago' },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0">
                <span className="text-sm text-gray-700">{activity.text}</span>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Stats</h2>
          <div className="space-y-4">
            {[
              { label: 'Conversion Rate', value: '32%', color: 'text-blue-600' },
              { label: 'Avg Deal Size', value: '$8,500', color: 'text-green-600' },
              { label: 'Pipeline Value', value: '$250K', color: 'text-purple-600' },
            ].map((stat, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{stat.label}</span>
                <span className={`text-lg font-bold ${stat.color}`}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;