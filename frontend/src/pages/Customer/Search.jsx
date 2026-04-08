import { useState, useEffect } from 'react';
import axios from 'axios';
import { SearchIcon, MapPin, IndianRupee, Star, CheckCircle, XCircle, Navigation, Map as MapIcon } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix leaflet default icon in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapBoundsUpdater({ providers, userLat, userLng }) {
  const map = useMap();
  useEffect(() => {
    if (providers.length > 0) {
      const bounds = L.latLngBounds(providers.map(p => [p.location.lat, p.location.lng]));
      if (userLat && userLng) {
        bounds.extend([parseFloat(userLat), parseFloat(userLng)]);
      }
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (userLat && userLng) {
      map.setView([parseFloat(userLat), parseFloat(userLng)], 12);
    }
  }, [providers, userLat, userLng, map]);
  return null;
}

const Search = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const categories = ['', 'Plumber', 'Electrician', 'Carpenter', 'Milkman', 'Cleaner', 'Mechanic', 'Painter', 'Other'];
  
  const [filters, setFilters] = useState({
    category: '',
    city: '',
    minPrice: '',
    maxPrice: '',
    userLat: '',
    userLng: ''
  });

  const handleInputChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFilters(prev => ({
          ...prev,
          userLat: position.coords.latitude,
          userLng: position.coords.longitude
        }));
      },
      () => {
        setError('Unable to retrieve your location. Check permissions.');
      }
    );
  };

  const getProviders = async () => {
    setLoading(true);
    setError('');
    try {
      // Build query string
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const { data } = await axios.get(`/api/public/providers/search?${params.toString()}`);
      setProviders(data);
    } catch (err) {
      setError('Failed to fetch providers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProviders();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    getProviders();
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-8">
      {/* Filters Sidebar */}
      <div className="w-full md:w-1/4 bg-white p-6 rounded-lg shadow-sm self-start sticky top-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center"><SearchIcon className="w-5 h-5 mr-2"/> Filters</h2>
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select name="category" value={filters.category} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500">
              {categories.map(c => <option key={c} value={c}>{c || 'All Categories'}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <input type="text" name="city" value={filters.city} onChange={handleInputChange} placeholder="e.g. Chennai" className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Min ₹</label>
              <input type="number" name="minPrice" value={filters.minPrice} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Max ₹</label>
              <input type="number" name="maxPrice" value={filters.maxPrice} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200 mt-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-gray-500 font-semibold">Proximity Scoring</p>
              <button 
                type="button" 
                onClick={handleGetLocation}
                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                <Navigation className="w-3 h-3 mr-1" /> Use Current Location
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Your Latitude</label>
              <input type="number" step="any" name="userLat" value={filters.userLat} onChange={handleInputChange} placeholder="e.g. 13.0827" className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700">Your Longitude</label>
              <input type="number" step="any" name="userLng" value={filters.userLng} onChange={handleInputChange} placeholder="e.g. 80.2707" className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 mt-4">
            Apply Filters
          </button>
        </form>
      </div>

      {/* Results */}
      <div className="w-full md:w-3/4">
        <h2 className="text-2xl font-bold mb-4">Search Results</h2>
        {error && <div className="p-3 bg-red-50 text-red-600 rounded mb-4">{error}</div>}
        
        {/* Interactive Map View */}
        <div className="mb-6 h-80 rounded-lg overflow-hidden border border-gray-200 shadow-sm relative z-0">
          <MapContainer center={[13.0827, 80.2707]} zoom={12} style={{ height: '100%', width: '100%', zIndex: 0 }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {providers.map(p => (
              <Marker key={p._id} position={[p.location.lat, p.location.lng]}>
                <Popup>
                  <div className="text-center">
                    <strong className="block text-sm">{p.name}</strong>
                    <span className="text-xs text-gray-500">{p.serviceCategory}</span>
                  </div>
                </Popup>
              </Marker>
            ))}
            {filters.userLat && filters.userLng && (
              <Marker 
                position={[parseFloat(filters.userLat), parseFloat(filters.userLng)]} 
                icon={L.icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41]
                })}
              >
                <Popup><strong>You are here</strong></Popup>
              </Marker>
            )}
            <MapBoundsUpdater providers={providers} userLat={filters.userLat} userLng={filters.userLng} />
          </MapContainer>
        </div>

        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {providers.length > 0 ? providers.map((provider) => (
              <div key={provider._id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <img src={provider.profilePhoto || 'https://via.placeholder.com/150'} alt={provider.name} className="h-16 w-16 rounded-full object-cover" />
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{provider.name}</h3>
                      <p className="text-sm text-blue-600 font-medium">{provider.serviceCategory}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      {provider.location.area}, {provider.location.city} 
                      {provider.distance !== undefined && provider.distance !== null && 
                        <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                          {provider.distance.toFixed(1)} km away
                        </span>
                      }
                    </div>
                    <div className="flex items-center">
                      <IndianRupee className="w-4 h-4 mr-2 text-gray-400" />
                      ₹{provider.hourlyPricing}/hour
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-yellow-500" />
                      {provider.averageRating.toFixed(1)} ({provider.totalReviews} reviews)
                    </div>
                    <div className="flex items-center pt-2">
                      {provider.availability ? (
                        <span className="inline-flex items-center text-green-600"><CheckCircle className="w-4 h-4 mr-1"/> Available Now</span>
                      ) : (
                        <span className="inline-flex items-center text-red-500"><XCircle className="w-4 h-4 mr-1"/> Not Available</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    {provider.finalScore !== undefined && (
                      <div className="text-xs text-gray-500 mb-2">Algorithm Match Score: {provider.finalScore.toFixed(0)}</div>
                    )}
                    <button className="w-full bg-gray-900 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                      View Full Profile
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-2 text-center py-20 text-gray-500">
                No providers found matching your criteria.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
