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
  const [isGuestMode, setIsGuestMode] = useState(false);

  useEffect(() => {
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
            // Exit guest mode if user is logged in
            if (isGuestMode) {
              setIsGuestMode(false);
              localStorage.removeItem('guestMode');
            }
          } else {
            // If token is invalid or user is blocked
            const errorData = await response.json();
            
            // Check if user is blocked
            if (handleBlockedUserError(errorData.msg, logout)) {
              return;
            }
            
            // Clear the token
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

  // Enable guest mode
  const enableGuestMode = () => {
    setIsGuestMode(true);
    localStorage.setItem('guestMode', 'true');
    
    setUser({
      _id: 'guest',
      username: 'Guest User',
      email: 'guest@example.com',
      profilePicture: '/guest-avatar.jpg',
      bio: 'Welcome to guest mode! You can browse content but need to create an account to post, like, or comment.',
      followers: [],
      following: []
    });
    
    setLoading(false);
  };

  // Disable guest mode
  const disableGuestMode = () => {
    setIsGuestMode(false);
    localStorage.removeItem('guestMode');
    if (!token) {
      setUser(null);
    }
  };

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
      
      // Exit guest mode if active
      disableGuestMode();
      
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
      
      // Exit guest mode if active
      disableGuestMode();
      
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
    // Also exit guest mode if active
    if (isGuestMode) {
      disableGuestMode();
    }
  };

  const updateUser = (updatedUserData) => {
    setUser(prevUser => {
      if (!prevUser) return prevUser;
      return {
        ...prevUser,
        ...updatedUserData
      };
    });
  };

  const value = {
  user,
  token,
  loading,
  error,
  isGuestMode,
  register,
  login,
  logout,
  enableGuestMode,
  disableGuestMode,
  changePassword,
  updateUser, 
  isAuthenticated: !!token || isGuestMode,
  isGenuineUser: !!token && !isGuestMode,
  isAdmin: user?.isAdmin || false
};

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}