/**
 * Dashboard Header - Usage Examples
 * This file contains various examples of how to use the DashboardHeader component
 */

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from './DashboardHeader';

// ============================================
// Example 1: Basic Usage
// ============================================
export const BasicExample = () => {
  const navigate = useNavigate();

  const handleHome = () => {
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    navigate('/auth/login');
  };

  return (
    <DashboardHeader 
      onHomeClick={handleHome}
      onLogoutClick={handleLogout}
    />
  );
};

// ============================================
// Example 2: With useCallback for Performance
// ============================================
export const OptimizedExample = () => {
  const navigate = useNavigate();

  // Memoize callbacks to prevent unnecessary re-renders
  const handleHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('userToken');
    navigate('/auth/login');
  }, [navigate]);

  return (
    <DashboardHeader 
      onHomeClick={handleHome}
      onLogoutClick={handleLogout}
    />
  );
};

// ============================================
// Example 3: With Confirmation Dialog
// ============================================
export const WithConfirmationExample = () => {
  const navigate = useNavigate();

  const handleHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleLogout = useCallback(() => {
    const confirmed = window.confirm('هل أنت متأكد من تسجيل الخروج؟');
    if (confirmed) {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      navigate('/auth/login');
    }
  }, [navigate]);

  return (
    <DashboardHeader 
      onHomeClick={handleHome}
      onLogoutClick={handleLogout}
    />
  );
};

// ============================================
// Example 4: With Analytics Tracking
// ============================================
export const WithAnalyticsExample = () => {
  const navigate = useNavigate();

  const handleHome = useCallback(() => {
    // Track analytics
    if (window.gtag) {
      window.gtag('event', 'click', {
        event_category: 'Navigation',
        event_label: 'Home Button'
      });
    }
    navigate('/');
  }, [navigate]);

  const handleLogout = useCallback(() => {
    // Track analytics
    if (window.gtag) {
      window.gtag('event', 'logout', {
        event_category: 'User',
        event_label: 'Logout Button'
      });
    }
    localStorage.removeItem('userToken');
    navigate('/auth/login');
  }, [navigate]);

  return (
    <DashboardHeader 
      onHomeClick={handleHome}
      onLogoutClick={handleLogout}
    />
  );
};

// ============================================
// Example 5: With API Call on Logout
// ============================================
export const WithAPICallExample = () => {
  const navigate = useNavigate();

  const handleHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    try {
      // Call logout API
      const token = localStorage.getItem('userToken');
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call result
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      navigate('/auth/login');
    }
  }, [navigate]);

  return (
    <DashboardHeader 
      onHomeClick={handleHome}
      onLogoutClick={handleLogout}
    />
  );
};

// ============================================
// Example 6: With Loading State
// ============================================
export const WithLoadingStateExample = () => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      localStorage.removeItem('userToken');
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  }, [navigate]);

  // Disable buttons during logout
  if (isLoggingOut) {
    return (
      <div style={{ opacity: 0.6, pointerEvents: 'none' }}>
        <DashboardHeader 
          onHomeClick={handleHome}
          onLogoutClick={handleLogout}
        />
      </div>
    );
  }

  return (
    <DashboardHeader 
      onHomeClick={handleHome}
      onLogoutClick={handleLogout}
    />
  );
};

// ============================================
// Example 7: With Context API
// ============================================
import { useAuth } from '../../../context/AuthContext'; // Hypothetical context

export const WithContextExample = () => {
  const navigate = useNavigate();
  const { logout } = useAuth(); // Using auth context

  const handleHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleLogout = useCallback(() => {
    logout(); // Use context logout function
    navigate('/auth/login');
  }, [logout, navigate]);

  return (
    <DashboardHeader 
      onHomeClick={handleHome}
      onLogoutClick={handleLogout}
    />
  );
};

// ============================================
// Example 8: With Toast Notifications
// ============================================
import toast from 'react-hot-toast'; // Hypothetical toast library

export const WithToastExample = () => {
  const navigate = useNavigate();

  const handleHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleLogout = useCallback(() => {
    toast.loading('جاري تسجيل الخروج...');
    
    setTimeout(() => {
      localStorage.removeItem('userToken');
      toast.dismiss();
      toast.success('تم تسجيل الخروج بنجاح');
      navigate('/auth/login');
    }, 1000);
  }, [navigate]);

  return (
    <DashboardHeader 
      onHomeClick={handleHome}
      onLogoutClick={handleLogout}
    />
  );
};

// ============================================
// Example 9: Conditional Rendering Based on User Role
// ============================================
export const ConditionalRenderExample = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');

  const handleHome = useCallback(() => {
    // Navigate based on role
    if (userRole === 'admin') {
      navigate('/admin');
    } else {
      navigate('/');
    }
  }, [navigate, userRole]);

  const handleLogout = useCallback(() => {
    localStorage.clear();
    navigate('/auth/login');
  }, [navigate]);

  return (
    <DashboardHeader 
      onHomeClick={handleHome}
      onLogoutClick={handleLogout}
    />
  );
};

// ============================================
// Example 10: With Redux
// ============================================
import { useDispatch } from 'react-redux'; // Hypothetical Redux
import { logoutUser } from '../../../store/actions/authActions';

export const WithReduxExample = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleLogout = useCallback(() => {
    dispatch(logoutUser()); // Dispatch Redux action
    navigate('/auth/login');
  }, [dispatch, navigate]);

  return (
    <DashboardHeader 
      onHomeClick={handleHome}
      onLogoutClick={handleLogout}
    />
  );
};

export default {
  BasicExample,
  OptimizedExample,
  WithConfirmationExample,
  WithAnalyticsExample,
  WithAPICallExample,
  WithLoadingStateExample,
  WithContextExample,
  WithToastExample,
  ConditionalRenderExample,
  WithReduxExample
};

