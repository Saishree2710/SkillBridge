import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Layout/Navbar';
import LandingPage from './pages/LandingPage';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Profile from './pages/Provider/Profile';
import Search from './pages/Customer/Search';
import ProviderDetail from './pages/Customer/ProviderDetail';
import CustomerBookings from './pages/Customer/CustomerBookings';
import ProviderRequests from './pages/Provider/ProviderRequests';
import Dashboard from './pages/Provider/Dashboard';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />; // or unauthorized page
  }

  return children;
};

const AppRoutes = () => {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['provider']}>
              <Profile />
            </ProtectedRoute>
          } />
          
          <Route path="/search" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <Search />
            </ProtectedRoute>
          } />

          <Route path="/bookings" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerBookings />
            </ProtectedRoute>
          } />

          <Route path="/requests" element={
            <ProtectedRoute allowedRoles={['provider']}>
              <ProviderRequests />
            </ProtectedRoute>
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['provider']}>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/provider/:id" element={
            <ProtectedRoute allowedRoles={['customer', 'provider']}>
              <ProviderDetail />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </>
  );
};

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Toaster position="top-center" reverseOrder={false} />
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
