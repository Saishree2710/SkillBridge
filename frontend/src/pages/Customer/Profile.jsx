import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Camera, Edit2, Save, X, Calendar, Phone, Mail, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const CustomerProfile = () => {
  const { user, getToken } = useAuth();
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: '',
    email: user?.email || '',
    profilePhoto: '',
    createdAt: ''
  });
  
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    cancelled: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fileInputRef = useRef();

  const fetchProfileAndStats = async () => {
    try {
      const [profileRes, bookingsRes] = await Promise.all([
        axios.get('/api/customers/profile', { headers: { Authorization: `Bearer ${getToken()}` } }),
        axios.get('/api/bookings/customer', { headers: { Authorization: `Bearer ${getToken()}` } })
      ]);
      
      const pData = profileRes.data;
      setProfileData({
        name: pData.name || '',
        phone: pData.phone || '',
        email: pData.email || '',
        profilePhoto: pData.profilePhoto || '',
        createdAt: pData.createdAt || new Date().toISOString()
      });
      
      if (pData.profilePhoto) {
        setPhotoPreview(pData.profilePhoto);
      }

      // Calculate stats from bookings
      const bookings = bookingsRes.data || [];
      const completed = bookings.filter(b => b.status === 'completed').length;
      const cancelled = bookings.filter(b => b.status === 'cancelled').length;
      
      setStats({
        total: bookings.length,
        completed,
        cancelled
      });

      // Recent bookings (last 3)
      const sorted = [...bookings].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRecentBookings(sorted.slice(0, 3));

    } catch (error) {
      toast.error('Error loading profile data');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'customer') {
      fetchProfileAndStats();
    } else {
      setFetching(false);
    }
  }, [user, getToken]);

  const handleInputChange = (e) => {
    setProfileData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      // Switch to edit mode if they pick a file
      setIsEditing(true); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Saving profile changes...');
    
    try {
      let finalPhotoUrl = null;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('photo', selectedFile);
        
        try {
          const res = await axios.post('/api/customers/upload-photo', formData, {
            headers: { 
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${getToken()}`
            }
          });
          if (res.data.success) {
            finalPhotoUrl = res.data.photoUrl;
          }
        } catch (uploadErr) {
          toast.error('Upload failed. Max size is 2MB.', { id: toastId });
          setLoading(false);
          return; 
        }
      }

      const payload = {
        name: profileData.name,
        phone: profileData.phone
      };
      
      if (finalPhotoUrl) {
        payload.profilePhoto = finalPhotoUrl;
      }

      await axios.put('/api/customers/profile', payload, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        }
      });
      
      toast.success('Profile updated successfully!', { id: toastId });
      setIsEditing(false);
      setSelectedFile(null);
      await fetchProfileAndStats();
      
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating profile', { id: toastId });
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-[var(--primary)] text-blue-800 border-blue-200 bg-opacity-20',
      'in-progress': 'bg-purple-100 text-purple-800 border-purple-200',
      completed: 'bg-[var(--success)] text-green-800 border-green-200 bg-opacity-20',
      cancelled: 'bg-[var(--danger)] text-red-800 border-red-200 bg-opacity-20'
    };
    const cssClass = colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${cssClass} capitalize`}>
        {status.replace('-', ' ')}
      </span>
    );
  };

  if (fetching) return <div className="text-center py-20 text-gray-500">Loading your profile...</div>;

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      
      {/* Top Banner & Profile Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8 relative">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-[var(--primary)]"></div>
        
        <div className="px-6 sm:px-10 pb-8">
          <div className="relative flex justify-between items-start -mt-12 sm:-mt-16">
            <div className="flex flex-col sm:flex-row items-center sm:items-end sm:space-x-5">
               
              <div className="relative group">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-md flex items-center justify-center">
                  {photoPreview ? (
                    <img src={photoPreview} alt={profileData.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="bg-blue-100 w-full h-full flex items-center justify-center text-blue-500 text-3xl font-bold">
                      {profileData.name ? profileData.name.charAt(0).toUpperCase() : <UserIcon className="w-12 h-12" />}
                    </div>
                  )}
                </div>
                {isEditing && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/jpg,image/jpeg,image/png" 
                  onChange={handleFileChange} 
                />
              </div>

              <div className="mt-4 sm:mt-0 text-center sm:text-left pb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{profileData.name}</h1>
                <p className="text-sm font-medium text-gray-500 flex items-center justify-center sm:justify-start mt-1">
                  <Calendar className="w-4 h-4 mr-1.5" />
                  Member since {new Date(profileData.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="pt-16 sm:pt-4">
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 border border-slate-200 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] transition-all duration-200 shadow-sm whitespace-nowrap"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  {isEditing ? (
                    <input type="text" name="name" required value={profileData.name} onChange={handleInputChange} className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm" />
                  ) : (
                    <div className="flex items-center text-gray-900 py-1.5"><UserIcon className="w-5 h-5 text-gray-400 mr-2"/> {profileData.name}</div>
                  )}
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  {/* Email mostly read-only logic standard */}
                  <div className="flex items-center text-gray-900 py-1.5"><Mail className="w-5 h-5 text-gray-400 mr-2"/> {profileData.email}</div>
               </div>
               
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  {isEditing ? (
                    <input type="tel" name="phone" value={profileData.phone} onChange={handleInputChange} className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm" placeholder="Add phone number" />
                  ) : (
                    <div className="flex items-center text-gray-900 py-1.5"><Phone className="w-5 h-5 text-gray-400 mr-2"/> {profileData.phone || <span className="text-gray-400 italic text-sm">Not provided</span>}</div>
                  )}
               </div>
             </div>

             {/* Action Buttons purely for Edit Mode */}
             {isEditing && (
               <div className="md:col-span-2 flex justify-end space-x-3 pt-6 border-t border-slate-100">
                 <button
                    type="button"
                    onClick={() => {
                        setIsEditing(false);
                        fetchProfileAndStats(); // reset changes
                    }}
                    disabled={loading}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] transition-all duration-200"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`inline-flex justify-center transition-all duration-200 py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-[var(--primary)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] items-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {loading ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                  </button>
               </div>
             )}
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stats Column */}
        <div className="lg:col-span-1 space-y-6">
           <h2 className="text-lg font-bold text-gray-900">Your Activity</h2>
           <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                 <span className="text-gray-500 font-medium">Total Bookings</span>
                 <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                 <span className="text-gray-500 font-medium">Completed</span>
                 <span className="text-2xl font-bold text-green-600">{stats.completed}</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-gray-500 font-medium">Cancelled</span>
                 <span className="text-2xl font-bold text-red-600">{stats.cancelled}</span>
              </div>
           </div>
        </div>

        {/* Recent Bookings Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Recent Bookings</h2>
            <a href="/bookings" className="text-sm font-medium text-[var(--primary)] hover:underline">View All</a>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {recentBookings.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {recentBookings.map((booking) => (
                  <li key={booking._id} className="p-4 sm:px-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        {/* We populate Provider fully on backend so it should safely fall back */}
                        <p className="text-sm font-medium text-[var(--primary)] truncate">{booking.provider?.name || 'Provider'}</p>
                        <p className="text-sm text-gray-500 mt-1 flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1.5" /> 
                          {booking.date} at {booking.timeSlot}
                        </p>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                         {getStatusBadge(booking.status)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-gray-900 font-medium mb-1">No bookings yet</h3>
                <p className="text-gray-500 text-sm max-w-sm">When you book a service, your recent activity will show up here.</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default CustomerProfile;
