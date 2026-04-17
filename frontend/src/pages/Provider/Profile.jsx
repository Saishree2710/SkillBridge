import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Camera, Save, MapPin as MapPinIcon, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';

// Fix leaflet default icon in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ChangeMapView({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords[0] && coords[1]) {
      map.flyTo(coords, 13);
    }
  }, [coords, map]);
  return null;
}

function LocationMarker({ position, setPosition, setAreaName }) {
  const map = useMapEvents({
    click(e) {
      if (setPosition) {
        setPosition(e.latlng);
        map.flyTo(e.latlng, map.getZoom());
      }
    },
  });

  useEffect(() => {
    const fetchAreaName = async () => {
      if (!position) return;
      try {
        const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${position.lat}&lon=${position.lng}&format=json`);
        if (res.data && res.data.address) {
          const areaName = res.data.address.suburb || res.data.address.neighbourhood || res.data.address.city_district || res.data.address.town || res.data.address.village || 'Selected Area';
          setAreaName(areaName);
        }
      } catch (err) {
        console.error("Geocoding failed", err);
      }
    };
    const timer = setTimeout(() => {
      fetchAreaName();
    }, 500); // Debounce
    return () => clearTimeout(timer);
  }, [position, setAreaName]);

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}


const Profile = () => {
  const { user, getToken } = useAuth();
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: '',
    serviceCategory: 'Plumber',
    city: '',
    area: '',
    hourlyPricing: '',
    availability: true,
    lat: 0,
    lng: 0,
  });
  
  const [photoPreview, setPhotoPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [pinPosition, setPinPosition] = useState(null);
  const [pinAreaName, setPinAreaName] = useState('');

  const fileInputRef = useRef();

  const categories = ['Plumber', 'Electrician', 'Carpenter', 'Milkman', 'Cleaner', 'Mechanic', 'Painter', 'Other'];

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get('/api/provider/profile', {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      
      setProfileData({
        name: data.name || user?.name || '',
        phone: data.phone || '',
        serviceCategory: data.serviceCategory || 'Plumber',
        city: data.location?.city || '',
        area: data.location?.area || '',
        hourlyPricing: data.hourlyPricing || '',
        availability: data.availability !== undefined ? data.availability : true,
        lat: data.location?.lat || 0,
        lng: data.location?.lng || 0,
      });
      
      if (data.location?.lat && data.location?.lng) {
        setPinPosition({ lat: data.location.lat, lng: data.location.lng });
      }

      if (data.profilePhoto) {
        setPhotoPreview(data.profilePhoto);
      }
    } catch (error) {
      if (error.response?.status !== 404 && error.response?.status !== 200) {
        toast.error('Error fetching profile');
      }
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'provider') {
      fetchProfile();
    } else {
      setFetching(false);
    }
  }, [user, getToken]);

  // Sync pinPosition back to profileData
  useEffect(() => {
    if (pinPosition) {
      setProfileData(prev => ({
        ...prev,
        lat: pinPosition.lat,
        lng: pinPosition.lng
      }));
    }
  }, [pinPosition]);

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

  const handlePositionChange = (pos) => {
    setPinPosition(pos);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Saving profile changes...');
    
    try {
      let finalPhotoUrl = null;

      // 1. Upload photo if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('photo', selectedFile);
        
        try {
          const res = await axios.post('/api/provider/upload-photo', formData, {
            headers: { 
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${getToken()}`
            }
          });
          if (res.data.success) {
            finalPhotoUrl = res.data.photoUrl;
          }
        } catch (uploadErr) {
          toast.error('Upload failed. Max size is 2MB. JPG/PNG only.', { id: toastId });
          setLoading(false);
          console.error(uploadErr);
          return; // Stop if upload fails
        }
      }

      // 2. Submit the profile json
      const payload = { ...profileData };
      if (finalPhotoUrl) {
        payload.profilePhoto = finalPhotoUrl;
      }

      await axios.post('/api/provider/profile', payload, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        }
      });
      
      toast.success('Profile updated successfully!', { id: toastId });
      
      // Re-fetch to cleanly refresh component data
      await fetchProfile();
      
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Error updating profile', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="text-center py-20">Loading profile...</div>;

  const defaultCenter = [13.0827, 80.2707]; // Chennai fallback

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Provider Profile</h1>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-2xl border border-slate-100 p-6 space-y-6">
        
        {/* Photo Upload */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-2 border-slate-200 cursor-pointer hover:border-[var(--primary)] transition-all duration-200" onClick={() => fileInputRef.current?.click()}>
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
            accept="image/jpg,image/jpeg,image/png" 
            onChange={handleFileChange} 
            disabled={loading}
          />
          <p className="text-sm text-gray-500 mt-2">Click to upload photo (Optional)</p>
        </div>

        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input type="text" name="name" required value={profileData.name} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm" />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700">Phone Number</label>
             <input type="tel" name="phone" required value={profileData.phone} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm" placeholder="e.g., +91 9876543210"/>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Hourly Pricing (₹)</label>
            <input type="number" name="hourlyPricing" required min="0" value={profileData.hourlyPricing} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Service Category</label>
            <select name="serviceCategory" value={profileData.serviceCategory} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="sm:col-span-2 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Location Settings</h3>
            <p className="text-sm text-gray-500 mb-4">
              Select your primary service area on the map, and enter your city details. Your exact coordinates are kept completely private.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* OPTION B: Manual Text Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input type="text" name="city" required value={profileData.city} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm" placeholder="e.g. Chennai" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Area / Neighborhood</label>
                  <input type="text" name="area" required value={profileData.area} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm" placeholder="e.g. Anna Nagar" />
                </div>
              </div>

               {/* OPTION A: Map Picker */}
               <div className="flex flex-col">
                  <div className="flex justify-between items-end pb-2">
                    <label className="block text-sm font-medium text-gray-700">Map Pin</label>
                    {pinAreaName && (
                      <span className="text-xs text-[var(--success)] font-medium">Pin dropped at {pinAreaName}</span>
                    )}
                  </div>
                  <div className="h-64 rounded-xl overflow-hidden border border-gray-300 relative z-0 flex-grow shadow-sm">
                    <MapContainer center={pinPosition || defaultCenter} zoom={11} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <LocationMarker position={pinPosition} setPosition={handlePositionChange} setAreaName={setPinAreaName} />
                      <ChangeMapView coords={pinPosition ? [pinPosition.lat, pinPosition.lng] : null} />
                    </MapContainer>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-right">Click anywhere on the map to place a pin</p>
               </div>

            </div>
          </div>

          <div className="sm:col-span-2 pt-6 border-t border-gray-200">
             <div className="flex items-center h-full">
              <input
                id="availability"
                name="availability"
                type="checkbox"
                checked={profileData.availability}
                onChange={handleInputChange}
                className="h-4 w-4 text-[var(--primary)] focus:ring-[var(--primary)] border-gray-300 rounded"
              />
              <label htmlFor="availability" className="ml-2 block text-sm font-medium text-gray-900">
                Currently Available to accept bookings
              </label>
            </div>
          </div>
          
        </div>

        <div className="pt-6 border-t border-gray-200 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`inline-flex justify-center transition-all duration-200 py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-[var(--primary)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] items-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <>
                 <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
