import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Calendar, User, Clock, MapPin, XCircle, Star, Phone, Mail, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const BookingCard = ({ booking, getToken, onCancel }) => {
  const [reviewState, setReviewState] = useState({ loading: true, exists: false, data: null });

  useEffect(() => {
    if (booking.status === 'completed') {
      axios.get(`/api/reviews/booking/${booking._id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      .then(res => {
        if (res.data.success && res.data.exists) {
          setReviewState({ loading: false, exists: true, data: res.data.review });
        } else {
          setReviewState({ loading: false, exists: false, data: null });
        }
      })
      .catch(err => {
        console.error("Error fetching review state", err);
        setReviewState({ loading: false, exists: false, data: null });
      });
    }
  }, [booking._id, booking.status, getToken]);

  const handleReviewSubmit = async () => {
    const rating = window.prompt("Rate this service (1-5):", "5");
    if (!rating || isNaN(rating) || rating < 1 || rating > 5) return toast.error("Invalid rating");
    const comment = window.prompt("Leave a comment:");
    if (!comment) return;
    
    try {
      const res = await axios.post('/api/reviews', {
        bookingId: booking._id,
        providerId: booking.provider._id,
        rating: Number(rating),
        comment
      }, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.data.success) {
        toast.success('Review submitted successfully!');
        setReviewState({ loading: false, exists: true, data: res.data.review });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting review');
    }
  };

  const showContact = ['confirmed', 'in-progress', 'completed'].includes(booking.status);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
      
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full capitalize border
              ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''}
              ${booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''}
              ${booking.status === 'in-progress' ? 'bg-purple-100 text-purple-800 border-purple-200' : ''}
              ${booking.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' : ''}
              ${booking.status === 'cancelled' ? 'bg-red-100 text-red-800 border-red-200' : ''}
            `}>
              {booking.status.replace('-', ' ')}
            </span>
            <span className="text-sm text-gray-500">Booked on {new Date(booking.createdAt).toLocaleDateString()}</span>
          </div>
          
          <h3 className="text-lg font-bold flex items-center">
            <User className="w-5 h-5 mr-2 text-[var(--primary)]"/> 
            <Link to={`/provider/${booking.provider?._id}`} className="hover:text-[var(--primary)] cursor-pointer">
              {booking.provider?.name || booking.provider?.user?.name || 'Provider'}
            </Link>
            <span className="text-sm text-gray-500 font-normal ml-2">({booking.provider?.serviceCategory || 'Service'})</span>
          </h3>
          
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center text-gray-600 text-sm">
              <Calendar className="w-4 h-4 mr-2" /> {new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric'})}
            </div>
            <div className="flex items-center text-gray-600 text-sm">
              <Clock className="w-4 h-4 mr-2" /> {booking.timeSlot}
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-2 md:items-end">
          {booking.status === 'pending' && (
            <button onClick={() => onCancel(booking._id)} className="inline-flex items-center justify-center px-4 py-2 border border-red-200 text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-all duration-200">
              <XCircle className="w-4 h-4 mr-2"/> Cancel Request
            </button>
          )}

          {booking.status === 'completed' && !reviewState.loading && (
            reviewState.exists ? (
               <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm flex flex-col items-end">
                  <div className="flex items-center text-green-700 font-medium mb-1">
                     <CheckCircle className="w-4 h-4 mr-1.5" /> Review Submitted
                  </div>
                  <div className="flex items-center text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < reviewState.data?.rating ? 'fill-current' : 'text-gray-300'}`} />
                    ))}
                  </div>
               </div>
            ) : (
              <button 
                onClick={handleReviewSubmit} 
                className="inline-flex items-center justify-center px-4 py-2 border border-blue-200 text-sm font-medium rounded-lg text-[var(--primary)] bg-blue-50 hover:bg-blue-100 transition-all duration-200"
              >
                <Star className="w-4 h-4 mr-2"/> Leave Review
              </button>
            )
          )}
        </div>
      </div>

      {showContact && booking.provider?.user && (
         <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
           <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Provider Contact Details</h4>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="flex items-center text-sm text-gray-800">
                 <User className="w-4 h-4 text-gray-400 mr-2" />
                 {booking.provider?.user?.name}
              </div>

              {booking.provider?.user?.phone && (
                <div className="flex items-center text-sm">
                  <Phone className="w-4 h-4 text-[var(--primary)] mr-2" />
                  <a href={`tel:${booking.provider?.user?.phone}`} className="text-[var(--primary)] hover:underline font-medium">
                     {booking.provider?.user?.phone}
                  </a>
                </div>
              )}

              {booking.provider?.user?.email && (
                <div className="flex items-center text-sm">
                  <Mail className="w-4 h-4 text-[var(--primary)] mr-2" />
                  <a href={`mailto:${booking.provider?.user?.email}`} className="text-[var(--primary)] hover:underline font-medium truncate">
                     {booking.provider?.user?.email}
                  </a>
                </div>
              )}

              <div className="flex items-center text-sm text-gray-800">
                 <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                 {booking.provider?.location?.area ? `${booking.provider.location.area}, ${booking.provider.location.city}` : 'Area not specified'}
              </div>

           </div>
         </div>
      )}

    </div>
  );
}

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
      toast.error('Could not load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [getToken]);

  const handleCancel = async (id) => {
    // Replaced window.confirm with toast-driven logic conceptually, 
    // but a quick native confirm works for simplicity. Ideally a custom modal 
    // is used. Standard implementation:
    if (!window.confirm('Are you sure you want to cancel this booking request?')) return;
    const toastId = toast.loading('Cancelling...');
    try {
      await axios.put(`/api/bookings/${id}/status`, { status: 'cancelled' }, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      toast.success('Booking request cancelled', { id: toastId });
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error cancelling booking', { id: toastId });
    }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-4">
      <div className="animate-pulse flex space-x-4">
        <div className="flex-1 space-y-4 py-1">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-40 bg-gray-200 rounded-xl w-full"></div>
          <div className="h-40 bg-gray-200 rounded-xl w-full"></div>
        </div>
      </div>
    </div>
  );
  
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
        <Link to="/" className="text-[var(--primary)] hover:text-blue-800 font-medium transition-colors">
          &larr; Back to Home
        </Link>
      </div>
      
      {bookings.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
           <Calendar className="w-16 h-16 text-gray-300 mb-4" />
           <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
           <p className="text-gray-500 max-w-md mx-auto mb-6">Looks like you haven't booked any services yet. Find the right professional for your needs.</p>
           <Link to="/search" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-[var(--primary)] hover:opacity-90">
             Explore Providers
           </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map(booking => (
            <BookingCard 
              key={booking._id} 
              booking={booking} 
              getToken={getToken} 
              onCancel={handleCancel} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerBookings;
