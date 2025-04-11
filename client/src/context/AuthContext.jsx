import React, { createContext, useContext, useState, useEffect } from 'react';
import { handleBlockedUserError } from '../utils/AuthUtils';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If there's a token in localStorage, try to get user data
    const loadUser = async () => {
      if (token) {
        try {
          const response = await fetch('http://localhost:5050/auth/user', {
            headers: {
              'x-auth-token': token
            }
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // If token is invalid or user is blocked
            const errorData = await response.json();
            
            // Check if user is blocked
            if (handleBlockedUserError(errorData.msg, logout)) {
              return;
            }
            
            // Otherwise, just clear the token
            localStorage.removeItem('token');
            setToken(null);
          }
        } catch (err) {
          console.error('Error loading user:', err);
          setError('Error loading user data');
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  // Register a new user
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5050/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.msg || 'Registration failed');
      }

      // Save token to localStorage
      localStorage.setItem('token', data.token);
      setToken(data.token);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5050/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.msg || 'Login failed');
      }

      // Save token to localStorage
      localStorage.setItem('token', data.token);
      setToken(data.token);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5050/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Check if user is blocked
        if (handleBlockedUserError(data.msg, logout)) {
          return { success: false, message: data.msg };
        }
        
        throw new Error(data.msg || 'Password change failed');
      }

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    error,
    register,
    login,
    logout,
    changePassword,
    isAuthenticated: !!token,
    isAdmin: user?.isAdmin || false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}