import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { IndianRupee, Eye, CheckCircle, MessageSquare, Award, Star } from 'lucide-react';

const Dashboard = () => {
  const { getToken } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await axios.get('/api/dashboard/provider', {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        setDashboardData(data);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [getToken]);

  if (loading) return <div className="text-center py-20">Loading dashboard...</div>;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;

  const { stats, chartData, recentBookings } = dashboardData;

  const StatCard = ({ title, value, icon, subtitle }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center">
      <div className="p-3 rounded-full bg-blue-50 text-blue-600 mr-4">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className="flex items-baseline">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="ml-2 text-sm font-medium text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Provider Dashboard</h1>
      </div>

      {/* Badges Section */}
      {stats.badges && stats.badges.length > 0 && (
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-100">
          <h2 className="text-sm font-bold text-yellow-800 uppercase tracking-wider mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2" /> Earned Badges
          </h2>
          <div className="flex flex-wrap gap-4">
            {stats.badges.map((badge, idx) => (
              <div key={idx} className="flex items-center px-4 py-2 bg-white rounded-full shadow-sm border border-yellow-200">
                <Star className="w-4 h-4 text-yellow-500 mr-2" fill="currentColor" />
                <span className="font-semibold text-gray-800 text-sm">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Earnings" 
          value={`₹${stats.totalEarnings}`} 
          icon={<IndianRupee className="w-6 h-6" />} 
        />
        <StatCard 
          title="Trust Score" 
          value={stats.trustScore} 
          subtitle="/ 100"
          icon={<CheckCircle className="w-6 h-6" />} 
        />
        <StatCard 
          title="Profile Views" 
          value={stats.profileViews} 
          icon={<Eye className="w-6 h-6" />} 
        />
        <StatCard 
          title="Response Rate" 
          value={`${stats.responseRate}%`} 
          icon={<MessageSquare className="w-6 h-6" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Earnings Over Time</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="earnings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Reputation Summary</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-end mb-1">
                <span className="text-sm font-medium text-gray-500">Average Rating</span>
                <span className="text-lg font-bold">{stats.averageRating.toFixed(1)} <span className="text-sm font-normal text-gray-500">/ 5.0</span></span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${(stats.averageRating / 5) * 100}%` }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-end mb-1">
                <span className="text-sm font-medium text-gray-500">Jobs Completed</span>
                <span className="text-lg font-bold">{stats.completedJobs}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Recent Booking History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentBookings.length > 0 ? recentBookings.map((booking) => (
                <tr key={booking._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(booking.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{booking.customer?.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${booking.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {booking.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">No recent bookings.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
