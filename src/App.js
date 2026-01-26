import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Home from './components/Home/Home';
import Blog from './components/Blog/Blog';
import Contact from './components/Contact/Contact';
import Booking from './components/Booking/Booking';
import About from './components/About/About';
import DoctorsSection from './components/Doctors/DoctorsSection';
import OffersSection from './components/Offers/OffersSection';
import Login from './components/Login/Login';
import GhymAuthRegister from './components/Register/Register';
import Profile from './components/Profile/Profile';
import Category from './components/Category/Category';
import ServiceDetails from './components/ServiceDetails/ServiceDetails';
import DashboardOptimized from './components/Dashes/DashboardOptimized';
import WhatsAppButton from './components/WhatsAppButton/WhatsAppButton';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>جاري التحميل...</div>;
  }

  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/offers" element={<OffersSection />} />
          <Route path="/doctors" element={<DoctorsSection />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<GhymAuthRegister />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardOptimized />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/*" element={
            <ProtectedRoute>
              <DashboardOptimized />
            </ProtectedRoute>
          } />
          <Route path="/category" element={<Category />} />
          <Route path="/service/:clinicId/:serviceId" element={<ServiceDetails />} />
        </Routes>
        
        {/* زر الواتساب الطائر - يظهر في كل الصفحات */}
        <WhatsAppButton />
      </Router>
    </AuthProvider>
  );
}

export default App;
