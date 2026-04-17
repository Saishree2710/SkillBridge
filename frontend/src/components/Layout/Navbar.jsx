import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Search, Briefcase, Calendar, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const NavLink = ({ to, icon, children }) => {
    const active = isActive(to);
    return (
      <Link 
        to={to} 
        onClick={() => setIsMobileMenuOpen(false)}
        className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-all duration-200 ${
          active 
            ? 'bg-[var(--primary)] text-white' 
            : 'text-gray-700 hover:text-[var(--primary)] hover:bg-blue-50'
        }`}
      >
        <span className="mr-1.5">{icon}</span>
        {children}
      </Link>
    );
  };

  const MobileNavLink = ({ to, icon, children }) => {
    const active = isActive(to);
    return (
      <Link 
        to={to} 
        onClick={() => setIsMobileMenuOpen(false)}
        className={`block px-3 py-2 rounded-md text-base font-medium flex items-center transition-all duration-200 ${
          active 
            ? 'bg-[var(--primary)] text-white' 
            : 'text-gray-700 hover:text-[var(--primary)] hover:bg-blue-50'
        }`}
      >
        <span className="mr-3">{icon}</span>
        {children}
      </Link>
    );
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 z-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center group">
              <div className="bg-[var(--primary)] p-1.5 rounded-lg mr-2 group-hover:scale-105 transition-transform">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight">SkillBridge</span>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-2">
            {user ? (
              <>
                <NavLink to="/" icon={<Briefcase className="h-4 w-4" />}>Home</NavLink>
                {user.role === 'customer' ? (
                  <>
                    <NavLink to="/search" icon={<Search className="h-4 w-4" />}>Find Providers</NavLink>
                    <NavLink to="/bookings" icon={<Calendar className="h-4 w-4" />}>My Bookings</NavLink>
                    <NavLink to="/customer/profile" icon={<User className="h-4 w-4" />}>My Profile</NavLink>
                  </>
                ) : (
                  <>
                    <NavLink to="/dashboard" icon={<Briefcase className="h-4 w-4" />}>Dashboard</NavLink>
                    <NavLink to="/requests" icon={<Calendar className="h-4 w-4" />}>Requests</NavLink>
                    <NavLink to="/profile" icon={<User className="h-4 w-4" />}>Profile</NavLink>
                  </>
                )}
                
                <div className="h-6 w-px bg-gray-200 mx-2"></div>
                
                <div className="text-sm font-medium text-gray-500 mr-2 flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-[var(--primary)] flex items-center justify-center font-bold mr-2">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm font-medium flex items-center cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-200"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-gray-700 hover:text-[var(--primary)] px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Log in
                </Link>
                <Link to="/register" className="bg-[var(--primary)] hover:opacity-90 text-white px-5 py-2 rounded-lg text-sm font-medium shadow-sm transition-all duration-200">
                  Sign up
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--primary)]"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute w-full bg-white shadow-lg z-50 border-b border-slate-100">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {user ? (
              <>
                <div className="flex items-center px-3 py-3 mb-2 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-[var(--primary)] flex items-center justify-center font-bold mr-3">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                  </div>
                </div>
                
                <MobileNavLink to="/" icon={<Briefcase className="h-5 w-5" />}>Home</MobileNavLink>
                {user.role === 'customer' ? (
                  <>
                    <MobileNavLink to="/search" icon={<Search className="h-5 w-5" />}>Find Providers</MobileNavLink>
                    <MobileNavLink to="/bookings" icon={<Calendar className="h-5 w-5" />}>My Bookings</MobileNavLink>
                    <MobileNavLink to="/customer/profile" icon={<User className="h-5 w-5" />}>My Profile</MobileNavLink>
                  </>
                ) : (
                  <>
                    <MobileNavLink to="/dashboard" icon={<Briefcase className="h-5 w-5" />}>Dashboard</MobileNavLink>
                    <MobileNavLink to="/requests" icon={<Calendar className="h-5 w-5" />}>Booking Requests</MobileNavLink>
                    <MobileNavLink to="/profile" icon={<User className="h-5 w-5" />}>My Profile</MobileNavLink>
                  </>
                )}
                
                <div className="pt-2 mt-2 border-t border-gray-100">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50 flex items-center transition-colors"
                  >
                    <LogOut className="h-5 w-5 mr-3" /> Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col space-y-2 p-2">
                <Link 
                  to="/login" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center block text-gray-700 hover:text-[var(--primary)] px-3 py-2 rounded-md font-medium bg-gray-50 transition-colors"
                >
                  Log in
                </Link>
                <Link 
                  to="/register" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center block bg-[var(--primary)] text-white px-3 py-2 rounded-md font-medium shadow-sm"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
