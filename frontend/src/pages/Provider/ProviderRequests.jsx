import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Calendar, User, Clock, FileText, CheckCircle, XCircle, PlayCircle, Phone, Mail } from 'lucide-react';

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
      // Sort: pending first, then by date 
      setBookings(data.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (b.status === 'pending' && a.status !== 'pending') return 1;
        return new Date(a.date) - new Date(b.date);
      }));
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
    const toastId = toast.loading('Updating booking status...');
    try {
      await axios.put(`/api/bookings/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status } : b));
      toast.success(`Booking ${status} successfully!`, { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating status', { id: toastId });
    } finally {
      setUpdatingId(null);
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
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b border-gray-200 pb-4">Booking Requests & Schedule</h1>
      
      {bookings.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <Calendar className="w-16 h-16 text-gray-200 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No requests yet</h3>
            <p className="text-gray-500 mt-2">When customers book your service, their requests will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map(booking => (
            <div key={booking._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-5">
              
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full capitalize border
                      ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''}
                      ${booking.status === 'confirmed' ? 'bg-[var(--primary)] bg-opacity-10 text-[var(--primary)] border-[var(--primary)] border-opacity-20' : ''}
                      ${booking.status === 'in-progress' ? 'bg-purple-100 text-purple-800 border-purple-200' : ''}
                      ${booking.status === 'completed' ? 'bg-[var(--success)] bg-opacity-10 text-[var(--success)] border-[var(--success)] border-opacity-20' : ''}
                      ${booking.status === 'cancelled' ? 'bg-[var(--danger)] bg-opacity-10 text-[var(--danger)] border-[var(--danger)] border-opacity-20' : ''}
                    `}>
                      {booking.status.replace('-', ' ')}
                    </span>
                    <span className="text-sm text-gray-500">Requested on {new Date(booking.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold flex items-center text-gray-900">
                    <User className="w-5 h-5 mr-2 text-[var(--primary)]"/> {booking.customer?.name}
                  </h3>
                  
                  <div className="flex items-center space-x-4 text-gray-600 text-sm">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1.5 text-gray-400" /> {new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric'})}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1.5 text-gray-400" /> {booking.timeSlot}
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="flex items-start text-gray-700 text-sm bg-blue-50/50 p-3 rounded-lg border border-blue-100/50 max-w-2xl">
                      <FileText className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-blue-400" /> <span className="italic">"{booking.notes}"</span>
                    </div>
                  )}
                </div>

                {/* State specific action buttons */}
                <div className="flex flex-wrap gap-3 lg:justify-end shrink-0">
                    {booking.status === 'pending' && (
                      <>
                        <button disabled={updatingId === booking._id} onClick={() => updateStatus(booking._id, 'confirmed')} className="flex items-center px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all">
                          <CheckCircle className="w-4 h-4 mr-2"/> Accept Request
                        </button>
                        <button disabled={updatingId === booking._id} onClick={() => updateStatus(booking._id, 'cancelled')} className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all">
                          <XCircle className="w-4 h-4 mr-2 text-gray-400"/> Decline
                        </button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <button disabled={updatingId === booking._id} onClick={() => updateStatus(booking._id, 'in-progress')} className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-all shadow-sm">
                        <PlayCircle className="w-4 h-4 mr-2"/> Start Job (In Progress)
                      </button>
                    )}
                    {booking.status === 'in-progress' && (
                      <button disabled={updatingId === booking._id} onClick={() => updateStatus(booking._id, 'completed')} className="flex items-center px-4 py-2 bg-[var(--success)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all shadow-sm">
                        <CheckCircle className="w-4 h-4 mr-2"/> Complete Service
                      </button>
                    )}
                </div>

              </div>

              {/* Customer Contact Details Block */}
              {['confirmed', 'in-progress', 'completed'].includes(booking.status) && booking.customer && (
                 <div className="mt-2 bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-wrap gap-y-3 gap-x-8">
                    <div className="w-full mb-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer Contact Information</span>
                    </div>
                    {booking.customer.phone ? (
                       <div className="flex items-center text-sm">
                         <Phone className="w-4 h-4 text-gray-400 mr-2" />
                         <a href={`tel:${booking.customer.phone}`} className="text-gray-900 font-medium hover:text-[var(--primary)] hover:underline">
                            {booking.customer.phone}
                         </a>
                         <a href={`tel:${booking.customer.phone}`} className="ml-3 inline-flex items-center px-2.5 py-1 text-xs font-medium rounded bg-[var(--primary)] text-white hover:opacity-90">Call</a>
                       </div>
                    ) : (
                       <div className="flex items-center text-sm text-gray-500 italic">
                         <Phone className="w-4 h-4 mr-2 opacity-50" /> No phone provided
                       </div>
                    )}
                    
                    {booking.customer.email && (
                       <div className="flex items-center text-sm">
                         <Mail className="w-4 h-4 text-gray-400 mr-2" />
                         <a href={`mailto:${booking.customer.email}`} className="text-gray-900 hover:text-[var(--primary)] hover:underline">
                            {booking.customer.email}
                         </a>
                       </div>
                    )}
                 </div>
              )}

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProviderRequests;
