import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Star, MapPin, Search, ChevronRight, ChevronLeft } from 'lucide-react';

const LandingPage = () => {
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const images = [
    '/assets/img1.png', // Plumber
    '/assets/img2.png', // Electrician 
    '/assets/img3.png'  // Carpenter
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 4000); // changes every 4 seconds
    return () => clearInterval(timer);
  }, [images.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % images.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <div className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32 pt-20 px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block xl:inline">Find reliable local</span>{' '}
              <span className="block text-blue-600 xl:inline">service providers</span>
            </h1>
            <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl md:mt-5 md:text-xl">
              Connect with verified plumbers, electricians, carpenters, and more in your neighborhood. Real reviews, localized discovery.
            </p>
            <div className="mt-5 sm:mt-8 sm:flex sm:justify-start">
              {!user ? (
                <>
                  <div className="rounded-md shadow">
                    <Link to="/register?role=customer" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg transition-colors">
                      Hire a Pro
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link to="/register?role=provider" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg transition-colors">
                      Join as a Pro
                    </Link>
                  </div>
                </>
              ) : (
                <div className="rounded-md shadow">
                  <Link to={user.role === 'customer' ? '/search' : '/profile'} className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg transition-colors">
                    {user.role === 'customer' ? 'Find Providers' : 'Go to Profile'}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 relative bg-gradient-to-br from-blue-400 to-indigo-600 h-64 sm:h-80 lg:h-full overflow-hidden flex items-center justify-center p-6 lg:p-12">
          
          <div className="relative w-full h-full bg-gray-100 overflow-hidden shadow-2xl">
            {images.map((img, index) => (
              <div 
                key={index}
                className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
              >
                <img src={img} alt={`Professional service ${index}`} className="w-full h-full object-cover" />
              </div>
            ))}
            {/* Controls */}
            <div className="absolute bottom-4 right-4 flex space-x-2">
              <button 
                onClick={prevSlide}
                className="bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={nextSlide}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            {/* Progress Indicators */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {images.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-blue-600' : 'w-2 bg-white/60'}`} 
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Overview */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <Search className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Easy Discovery</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Search by specific service categories with advanced filtering.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <MapPin className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Neighborhood Proximity</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Providers ranked by distance using the Haversine formula so you find locals fast.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <Star className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Reputation Score</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Powered by a verified trust score derived from ratings and availability.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <Shield className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Verified Profiles</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Real photos, transparent hourly pricing, and live availability toggles.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
