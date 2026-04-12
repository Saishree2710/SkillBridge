import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Calendar, User, Clock, FileText, XCircle, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const CustomerBookings = () => {
  const { getToken } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBookings = async () => {
    try {
      const { data } = await axios.get('/api/bookings/customer', {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setBookings(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (err) {
      setError('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [getToken]);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking request?')) return;
    try {
      await axios.put(`/api/bookings/${id}/status`, { status: 'cancelled' }, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      toast.success('Booking request cancelled');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error cancelling booking');
    }
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Bookings</h1>
        <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium">
          &larr; Back to Home
        </Link>
      </div>
      
      {bookings.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center text-gray-500">
          You have no bookings. <Link to="/search" className="text-blue-600 hover:underline">Find a provider</Link>
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
                  <span className="text-sm text-gray-500">Booked on {new Date(booking.createdAt).toLocaleDateString()}</span>
                </div>
                
                <h3 className="text-lg font-bold flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-400"/> 
                  <Link to={`/provider/${booking.provider?._id}`} className="hover:text-blue-600">
                    {booking.provider?.name}
                  </Link>
                  <span className="text-sm text-gray-500 font-normal ml-2">({booking.provider?.serviceCategory})</span>
                </h3>
                <div className="flex items-center text-gray-600 text-sm">
                  <Calendar className="w-4 h-4 mr-2" /> {new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric'})}
                </div>
                <div className="flex items-center text-gray-600 text-sm">
                  <Clock className="w-4 h-4 mr-2" /> {booking.timeSlot}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 md:justify-end">
                {booking.status === 'pending' && (
                  <button onClick={() => handleCancel(booking._id)} className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded text-sm hover:bg-red-100 border border-red-200">
                    <XCircle className="w-4 h-4 mr-2"/> Cancel Request
                  </button>
                )}
                {booking.status === 'completed' && (
                  <button onClick={() => {
                    const rating = window.prompt("Rate this service (1-5):", "5");
                    if (!rating || isNaN(rating) || rating < 1 || rating > 5) return alert("Invalid rating");
                    const comment = window.prompt("Leave a comment:");
                    if (!comment) return;
                    
                    axios.post('/api/reviews', {
                      bookingId: booking._id,
                      providerId: booking.provider._id,
                      rating: Number(rating),
                      comment
                    }, {
                      headers: { Authorization: `Bearer ${getToken()}` }
                    }).then(() => {
                      toast.success('Review submitted successfully!');
                    }).catch(err => {
                      toast.error(err.response?.data?.message || 'Error submitting review');
                    });
                  }} className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded text-sm hover:bg-blue-100 border border-blue-200">
                    <Star className="w-4 h-4 mr-2"/> Leave Review
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerBookings;
