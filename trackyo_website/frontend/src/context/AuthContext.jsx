import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useTheme } from './ThemeContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toggleTheme } = useTheme();

  // Load persistent user profile on startup
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('trackyo-token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data);
            // Apply their preferred theme
            if (res.data.themePreference) {
              toggleTheme(res.data.themePreference);
            }
          } else {
            logout();
          }
        } catch (err) {
          console.error('Error loading persistent user session: ', err);
          logout();
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  // Register action
  const register = async (name, email, password, mobile, preferredCurrency, themePreference) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/register', {
        name,
        email,
        password,
        mobile,
        preferredCurrency,
        themePreference,
      });

      if (res.data.success) {
        localStorage.setItem('trackyo-token', res.data.token);
        setUser(res.data);
        if (res.data.themePreference) {
          toggleTheme(res.data.themePreference);
        }
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed. Try again!',
      };
    } finally {
      setLoading(false);
    }
  };

  // Login action
  const login = async (email, password) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/login', { email, password });

      if (res.data.success) {
        localStorage.setItem('trackyo-token', res.data.token);
        setUser(res.data);
        if (res.data.themePreference) {
          toggleTheme(res.data.themePreference);
        }
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Invalid email or password combination',
      };
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Mock
  const forgotPassword = async (email) => {
    try {
      const res = await api.post('/auth/forgot-password', { email });
      return { success: res.data.success, message: res.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Password reset failed',
      };
    }
  };

  // Update Profile Preferences
  const updatePreferences = async (updates) => {
    try {
      const res = await api.put('/auth/preferences', updates);
      if (res.data.success) {
        setUser((prev) => ({ ...prev, ...res.data }));
        if (updates.themePreference) {
          toggleTheme(updates.themePreference);
        }
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update preferences',
      };
    }
  };

  // Logout action
  const logout = () => {
    localStorage.removeItem('trackyo-token');
    setUser(null);
    toggleTheme('dark'); // Reset back to default
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        forgotPassword,
        updatePreferences,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
