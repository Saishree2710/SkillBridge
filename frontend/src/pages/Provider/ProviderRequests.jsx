import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Calendar, User, Clock, FileText, CheckCircle, XCircle, PlayCircle, Loader } from 'lucide-react';

const ProviderRequests = () => {
  const { getToken } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchBookings = async () => {
    try {
      const { data } = await axios.get('/api/bookings/provider', {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      // Sort by date new to old or pending first
      setBookings(data.sort((a, b) => new Date(a.date) - new Date(b.date)));
    } catch (err) {
      setError('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [getToken]);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await axios.put(`/api/bookings/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      // Update local state
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status } : b));
      toast.success(`Booking ${status} successfully!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating status');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-6">Booking Requests & Schedule</h1>
      
      {bookings.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center text-gray-500">
          No bookings or requests yet.
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(booking => (
            <div key={booking._id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                    ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : ''}
                    ${booking.status === 'in-progress' ? 'bg-purple-100 text-purple-800' : ''}
                    ${booking.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                    ${booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                  `}>
                    {booking.status.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">Requested on {new Date(booking.createdAt).toLocaleDateString()}</span>
                </div>
                
                <h3 className="text-lg font-bold flex items-center"><User className="w-4 h-4 mr-2"/> {booking.customer?.name}</h3>
                <div className="flex items-center text-gray-600 text-sm">
                  <Calendar className="w-4 h-4 mr-2" /> {new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric'})}
                </div>
                <div className="flex items-center text-gray-600 text-sm">
                  <Clock className="w-4 h-4 mr-2" /> {booking.timeSlot}
                </div>
                {booking.notes && (
                  <div className="flex items-start text-gray-600 text-sm bg-gray-50 p-2 rounded mt-2">
                    <FileText className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" /> <span className="italic">{booking.notes}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 md:justify-end">
                {updatingId === booking._id ? (
                  <div className="flex items-center text-blue-600 text-sm"><Loader className="w-4 h-4 mr-2 animate-spin"/> Updating...</div>
                ) : (
                  <>
                    {booking.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(booking._id, 'confirmed')} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                          <CheckCircle className="w-4 h-4 mr-2"/> Accept
                        </button>
                        <button onClick={() => updateStatus(booking._id, 'cancelled')} className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded text-sm hover:bg-gray-300">
                          <XCircle className="w-4 h-4 mr-2"/> Decline
                        </button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <button onClick={() => updateStatus(booking._id, 'in-progress')} className="flex items-center px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">
                        <PlayCircle className="w-4 h-4 mr-2"/> Mark In-Progress
                      </button>
                    )}
                    {booking.status === 'in-progress' && (
                      <button onClick={() => updateStatus(booking._id, 'completed')} className="flex items-center px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                        <CheckCircle className="w-4 h-4 mr-2"/> Complete Task
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProviderRequests;
