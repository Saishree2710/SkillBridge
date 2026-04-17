import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { MapPin, IndianRupee, Star, Calendar, Clock } from 'lucide-react';

const generateTimeSlots = (selectedDate) => {
  // Hardcoded for 8:30 AM to 7:00 PM as per requirement
  const allSlots = [
    '08:30 - 09:30',
    '09:30 - 10:30',
    '10:30 - 11:30',
    '11:30 - 12:30',
    '12:30 - 13:30',
    '13:30 - 14:30',
    '14:30 - 15:30',
    '15:30 - 16:30',
    '16:30 - 17:30',
    '17:30 - 18:30'
  ];
  
  if (!selectedDate) return allSlots;

  const todayStr = new Date().toLocaleDateString('en-CA'); // Gets local YYYY-MM-DD
  const [selectedYear, selectedMonth, selectedDay] = selectedDate.split('-');
  const selectedDateObj = new Date(selectedYear, selectedMonth - 1, selectedDay);
  const now = new Date();
  
  // If the selected date is today, filter out past slots
  // Using toLocaleDateString('en-CA') as a generic way to grab YYYY-MM-DD cleanly across timezones
  if (selectedDate === todayStr || (selectedDateObj.getDate() === now.getDate() && selectedDateObj.getMonth() === now.getMonth() && selectedDateObj.getFullYear() === now.getFullYear())) {
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

    return allSlots.filter(slot => {
      const startTimeStr = slot.split(' - ')[0]; // e.g. "08:30"
      const [hours, minutes] = startTimeStr.split(':').map(Number);
      const slotTotalMinutes = hours * 60 + minutes;

      // Ensure the slot hasn't started yet
      return slotTotalMinutes > currentTotalMinutes;
    });
  }

  return allSlots;
};

const getDayName = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

const ProviderDetail = () => {
  const { id } = useParams();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  
  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [bookingDate, setBookingDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const fetchProviderData = async () => {
      try {
        const [providerRes, reviewsRes] = await Promise.all([
          axios.get(`/api/public/providers/${id}`),
          axios.get(`/api/reviews/public/${id}`).catch(() => ({ data: [] })) // Fallback if no reviews route
        ]);
        setProvider(providerRes.data);
        setReviews(reviewsRes.data);
      } catch (err) {
        setError('Provider not found');
      } finally {
        setLoading(false);
      }
    };
    fetchProviderData();
  }, [id]);

  const handleBookSlot = async (e) => {
    e.preventDefault();
    if (!bookingDate || !selectedSlot) {
      toast.error('Please select a date and timeslot');
      return;
    }

    setBookingLoading(true);

    try {
      await axios.post('/api/bookings', {
        providerId: id,
        date: bookingDate,
        timeSlot: selectedSlot,
        notes: bookingNotes
      }, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      
      toast.success('Booking requested! Check your bookings dashboard.');
      setSelectedSlot('');
      setBookingNotes('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating booking');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (error || !provider) return <div className="text-center py-20 text-red-500">{error}</div>;

  const today = new Date().toLocaleDateString('en-CA');
  const dayName = getDayName(bookingDate);
  const isWorkingDay = dayName && provider.availabilityConfig?.workingDays?.includes(dayName);
  const slots = generateTimeSlots(bookingDate);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
      
      {/* Provider Details */}
      <div className="md:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100 p-8">
        <div className="flex items-center space-x-6 mb-6">
          <img 
            src={provider.profilePhoto || 'https://via.placeholder.com/150'} 
            alt={provider.name} 
            className="h-24 w-24 rounded-full object-cover border-4 border-gray-50" 
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{provider.name}</h1>
            <p className="text-lg text-blue-600 font-medium">{provider.serviceCategory}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8">
          <div className="flex items-center space-x-3 text-gray-700 bg-gray-50 p-4 rounded-md">
            <MapPin className="w-5 h-5 text-gray-400" />
            <span>{provider.location.area}, {provider.location.city}</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-700 bg-gray-50 p-4 rounded-md">
            <IndianRupee className="w-5 h-5 text-gray-400" />
            <span>₹{provider.hourlyPricing}/hour</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-700 bg-gray-50 p-4 rounded-md">
            <Star className="w-5 h-5 text-yellow-500" />
            <span>{provider.averageRating.toFixed(1)} ({provider.totalReviews} reviews)</span>
          </div>
        </div>
      </div>

      {/* Booking Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 self-start sticky top-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2" /> Book an Appointment
        </h2>

        <form onSubmit={handleBookSlot} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
            <input 
              type="date" 
              min={today}
              value={bookingDate}
              onChange={(e) => {
                setBookingDate(e.target.value);
                setSelectedSlot('');
              }}
              className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {bookingDate && !isWorkingDay && (
            <p className="text-sm text-red-500 bg-red-50 p-2 rounded">
              {provider.name} does not work on {dayName}s.
            </p>
          )}

          {bookingDate && isWorkingDay && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Clock className="w-4 h-4 mr-1" /> Available Slots
              </label>
              <div className="grid grid-cols-2 gap-2">
                {slots.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 px-3 text-xs rounded border transition-colors ${
                      selectedSlot === slot 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedSlot && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
              <textarea 
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                rows="2"
                placeholder="Describe the issue..."
              ></textarea>
            </div>
          )}

          <button 
            type="submit" 
            disabled={bookingLoading || !selectedSlot}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors mt-4"
          >
            {bookingLoading ? 'Requesting...' : 'Request Booking'}
          </button>
        </form>
      </div>

      {/* Reviews Section */}
      <div className="md:col-span-3 mt-4">
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
        {reviews.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center text-gray-500">
            No reviews yet for this provider.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map(review => (
              <div key={review._id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-bold text-gray-900">{review.customer?.name}</div>
                  <div className="flex items-center text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 italic">"{review.comment}"</p>
                <div className="text-xs text-gray-400 mt-4">
                  {new Date(review.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default ProviderDetail;
