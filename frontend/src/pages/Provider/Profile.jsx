import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Camera, Save, MapPin as MapPinIcon, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix leaflet default icon in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ChangeMapView({ coords }) {
  const map = useMap();
  if (coords[0] && coords[1]) map.setView(coords, 13);
  return null;
}

const Profile = () => {
  const { user, getToken } = useAuth();
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    serviceCategory: 'Plumber',
    city: '',
    area: '',
    lat: '',
    lng: '',
    hourlyPricing: '',
    availability: true,
  });
  
  const [photoPreview, setPhotoPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fileInputRef = useRef();

  const categories = ['Plumber', 'Electrician', 'Carpenter', 'Milkman', 'Cleaner', 'Mechanic', 'Painter', 'Other'];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get('/api/provider/profile', {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        
        setProfileData({
          name: data.name,
          serviceCategory: data.serviceCategory,
          city: data.location.city,
          area: data.location.area,
          lat: data.location.lat,
          lng: data.location.lng,
          hourlyPricing: data.hourlyPricing,
          availability: data.availability,
        });
        
        if (data.profilePhoto) {
          setPhotoPreview(data.profilePhoto);
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          setMessage({ type: 'error', text: 'Error fetching profile' });
        }
      } finally {
        setFetching(false);
      }
    };
    
    if (user && user.role === 'provider') {
      fetchProfile();
    } else {
      setFetching(false);
    }
  }, [user, getToken]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);
    
    try {
      const formData = new FormData();
      Object.keys(profileData).forEach(key => {
        formData.append(key, profileData[key]);
      });
      
      if (selectedFile) {
        formData.append('profilePhoto', selectedFile);
      }

      await axios.post('/api/provider/profile', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${getToken()}`
        }
      });
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Error updating profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setMessage({ type: 'error', text: 'Geolocation is not supported by your browser.' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setProfileData(prev => ({
          ...prev,
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }));
        setMessage({ type: 'success', text: 'Location detected successfully!' });
      },
      () => {
        setMessage({ type: 'error', text: 'Unable to retrieve your location. Please check permissions.' });
      }
    );
  };

  if (fetching) return <div className="text-center py-20">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Provider Profile</h1>
      
      {message.text && (
        <div className={`p-4 mb-6 rounded-md ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        
        {/* Photo Upload */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            {photoPreview ? (
              <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Camera className="w-8 h-8 mb-1" />
                <span className="text-xs">Upload</span>
              </div>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
          />
          <p className="text-sm text-gray-500 mt-2">Click to upload photo (Optional)</p>
        </div>

        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input type="text" name="name" required value={profileData.name} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Service Category</label>
            <select name="serviceCategory" value={profileData.serviceCategory} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <input type="text" name="city" required value={profileData.city} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Area</label>
            <input type="text" name="area" required value={profileData.area} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Latitude</label>
            <input type="number" step="any" name="lat" required value={profileData.lat} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="e.g. 13.0827" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Longitude</label>
            <input type="number" step="any" name="lng" required value={profileData.lng} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="e.g. 80.2707" />
          </div>

          <div className="sm:col-span-2 pt-2">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Location Preview</label>
              <button 
                type="button" 
                onClick={handleGetLocation}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                <Navigation className="w-3 h-3 mr-1" /> Use Current Location
              </button>
            </div>
            <div className="h-64 rounded-md overflow-hidden border border-gray-300 relative z-0">
              {(profileData.lat && profileData.lng) ? (
                <MapContainer center={[profileData.lat, profileData.lng]} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[profileData.lat, profileData.lng]} />
                  <ChangeMapView coords={[profileData.lat, profileData.lng]} />
                </MapContainer>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50 text-gray-400">
                  <MapPinIcon className="w-8 h-8 mb-2" />
                  <span className="text-sm">Enter coordinates or use your location to see the map.</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Hourly Pricing (₹)</label>
            <input type="number" name="hourlyPricing" required min="0" value={profileData.hourlyPricing} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>

          <div className="flex items-center h-full pt-6">
            <input
              id="availability"
              name="availability"
              type="checkbox"
              checked={profileData.availability}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="availability" className="ml-2 block text-sm text-gray-900">
              Currently Available
            </label>
          </div>
          
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
