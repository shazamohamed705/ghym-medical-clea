import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast/ToastManager';
import LocationToast from './components/LocationToast/LocationToast';
import MetaTags from './components/MetaTags/MetaTags';
import DynamicTags from './components/DynamicTags/DynamicTags';
import useGeolocation from './hooks/useGeolocation';
import Home from './components/Home/Home';
import Blog from './components/Blog/Blog';
import BlogsList from './components/Blog/BlogsList';
import Contact from './components/Contact/Contact';
import Booking from './components/Booking/Booking';
import About from './components/About/About';
import DoctorsSection from './components/Doctors/DoctorsSection';
import OffersSection from './components/Offers/OffersSection';
import ServicesSection from './components/Services/ServicesSection';
import Login from './components/Login/Login';
import GhymAuthRegister from './components/Register/Register';
import Profile from './components/Profile/Profile';
import Category from './components/Category/Category';
import SearchResults from './components/Search/SearchResults';
import ServiceDetails from './components/ServiceDetails/ServiceDetails';
import DashboardOptimized from './components/Dashes/DashboardOptimized';
import WhatsAppButton from './components/WhatsAppButton/WhatsAppButton';
import Privacy from './components/Privacy/Privacy';
import ReturnPolicy from './components/ReturnPolicy/ReturnPolicy';
import TermsOfService from './components/TermsOfService/TermsOfService';
import BlogID from './components/Blog/BlogID';
import LaserGuidelines from './components/LaserGuidelines/LaserGuidelines';
import Cart from './components/Cart/Cart';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>جاري التحميل...</div>;
  }

  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

function App() {
  const [tags, setTags] = useState(null);
  const { latitude, longitude, error, loading } = useGeolocation();

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const baseUrl = process.env.REACT_APP_API_URL || 'https://ghaimcenter.com/laravel/api';
        const response = await fetch(`${baseUrl}/contact-data`);
        const data = await response.json();
        
        if (data.status === 'success' && data.data) {
          const tagsData = data.data.find(item => item.prefix === 'tags');
          if (tagsData) {
            setTags(tagsData.data);
          }
        }
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };

    fetchTags();
  }, []);

  // تسجيل الموقع عند الحصول عليه
  useEffect(() => {
    if (latitude && longitude) {
      console.log('🌍 موقع المستخدم:', { latitude, longitude });
      
      // يمكن إرسال الموقع للـ API هنا إذا لزم الأمر
      // sendLocationToAPI(latitude, longitude);
    }
  }, [latitude, longitude]);
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          {/* Dynamic Tags from API */}
          <DynamicTags tags={tags} />
          
          {/* Meta Tags - يحدث الـ title والـ favicon تلقائياً */}
          <MetaTags />
          
          {/* Location Toast - إشعارات الموقع - معطل مؤقتاً */}
          {/* <LocationToast /> */}
          
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/offers" element={<OffersSection />} />
            <Route path="/services" element={<ServicesSection />} />
            <Route path="/doctors" element={<DoctorsSection />} />
            <Route path="/blogs" element={<BlogsList />} />
            <Route path="/blogid/:blogId" element={<BlogID />} />
            <Route path="/blog/:blogId" element={<BlogID />} />
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
            <Route path="/search" element={<SearchResults />} />
            <Route path="/service/:clinicId/:serviceId" element={<ServiceDetails />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/return-policy" element={<ReturnPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/laser-guidelines" element={<LaserGuidelines />} />
            <Route path="/cart" element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            } />
          </Routes>
          
          {/* زر الواتساب الطائر - يظهر في كل الصفحات */}
          <WhatsAppButton />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
