import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationDropdown from "./NotificationDropdown";

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const mobileMenuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Clear search query when location changes and not on search page
  useEffect(() => {
    if (!location.pathname.includes('/search')) {
      setSearchQuery("");
    }
    // Close mobile menu when route changes
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  // Function to handle navigation and scroll to top
  const handleNavigation = (path) => {
    // If we're already on this path, just scroll to top
    if (location.pathname === path) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Navigate to the path and then scroll to top
      navigate(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Fixed navbar */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="px-4 sm:px-6 max-w-6xl mx-auto">
          {/* Desktop Navbar */}
          <div className="hidden md:flex md:flex-row justify-between items-center py-4 border-b border-amber-100">
            <NavLink 
              to="/" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-3xl font-bold text-orange-900 hover:text-yellow-600 transition"
            >
              Buzzly
            </NavLink>
            
            {isAuthenticated && (
              <form onSubmit={handleSearch} className="w-full md:w-1/3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="w-full py-2 px-4 pr-10 border border-amber-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-orange-900 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </form>
            )}
            
            <div className="flex gap-3 items-center">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center">
                    <img 
                      src={user?.profilePicture || "/default-avatar.jpg"} 
                      alt={user?.username || 'User'} 
                      className="h-8 w-8 rounded-full object-cover border-2 border-amber-100 shadow-sm mr-2"
                    />
                    <span className="text-sm text-gray-700 font-medium">
                      {user?.username || 'User'}
                    </span>
                  </div>
                  
                  {/* Notification Dropdown */}
                  <NotificationDropdown />
                  
                  {/* Feed button with scroll to top */}
                  <button 
                    onClick={() => handleNavigation("/")}
                    className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm transition ${
                      location.pathname === "/" 
                        ? 'bg-orange-900 text-white' 
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    Feed
                  </button>
                  
                  {/* My Profile button with scroll to top */}
                  <button 
                    onClick={() => handleNavigation(`/profile/${user?._id}`)}
                    className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm transition ${
                      location.pathname === `/profile/${user?._id}` 
                        ? 'bg-orange-900 text-white' 
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    My Profile
                  </button>
                  
                  {/* Admin Button - Only show for admin users */}
                  {isAdmin && (
                    <NavLink 
                      className={({ isActive }) =>
                        `inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm transition ${
                          isActive 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                        }`
                      }
                      to="/admin"
                    >
                      Admin
                    </NavLink>
                  )}
                  
                  {/* Settings Button */}
                  <NavLink 
                    className={({ isActive }) => 
                      `inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm transition ${
                        isActive 
                          ? 'bg-orange-900 text-white' 
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`
                    }
                    to="/settings"
                  >
                    Settings
                  </NavLink>
                  
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center justify-center px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm border border-red-200 transition"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    className={({ isActive }) => 
                      `inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm transition ${
                        isActive 
                          ? 'bg-gray-100 text-gray-700' 
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`
                    }
                    to="/login"
                  >
                    Login
                  </NavLink>
                  
                  <NavLink
                    className={({ isActive }) => 
                      `inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm transition ${
                        isActive 
                          ? 'bg-orange-900 text-white' 
                          : 'bg-orange-800 text-white hover:bg-yellow-600'
                      }`
                    }
                    to="/register"
                  >
                    Register
                  </NavLink>
                </>
              )}
            </div>
          </div>
          
          {/* Mobile Navbar */}
          <div className="flex md:hidden justify-between items-center h-14">
            <NavLink 
              to="/" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-2xl font-bold text-orange-900 hover:text-yellow-600 transition"
            >
              Buzzly
            </NavLink>
            
            <div className="flex items-center space-x-3">
              {isAuthenticated && (
                <>
                  {/* Notification icon for mobile */}
                  <NotificationDropdown />
                  
                  {/* User avatar for mobile */}
                  <div className="flex items-center">
                    <img 
                      src={user?.profilePicture || "/default-avatar.jpg"} 
                      alt={user?.username || 'User'} 
                      className="h-8 w-8 rounded-full object-cover border-2 border-amber-100 shadow-sm"
                    />
                  </div>
                </>
              )}
              
              {/* Hamburger Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:text-orange-900 transition focus:outline-none"
                aria-label="Toggle menu"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu (slide-down) */}
        {mobileMenuOpen && (
          <div 
            ref={mobileMenuRef}
            className="md:hidden bg-white border-t border-amber-100 shadow-lg transition-all duration-300 ease-in-out"
          >
            <div className="px-4 pt-2 pb-4 space-y-3">
              {isAuthenticated && (
                <form onSubmit={handleSearch} className="mb-3 pt-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search users..."
                      className="w-full py-2 px-4 pr-10 border border-amber-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition shadow-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-orange-900 transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>
                </form>
              )}
              
              {isAuthenticated ? (
                <>
                  <div className="border-b border-gray-100 pb-1 mb-1">
                    <p className="text-sm font-medium text-gray-800">
                      {user?.username || 'User'}
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => handleNavigation("/")}
                    className={`flex items-center w-full py-2 ${
                      location.pathname === "/" 
                        ? 'text-orange-900 font-medium' 
                        : 'text-gray-700'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Feed
                  </button>
                  
                  <button 
                    onClick={() => handleNavigation(`/profile/${user?._id}`)}
                    className={`flex items-center w-full py-2 ${
                      location.pathname === `/profile/${user?._id}` 
                        ? 'text-orange-900 font-medium' 
                        : 'text-gray-700'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    My Profile
                  </button>
                  
                  <NavLink 
                    to="/settings"
                    className={({ isActive }) => 
                      `flex items-center w-full py-2 ${
                        isActive ? 'text-orange-900 font-medium' : 'text-gray-700'
                      }`
                    }
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </NavLink>
                  
                  {isAdmin && (
                    <NavLink 
                      to="/admin"
                      className={({ isActive }) => 
                        `flex items-center w-full py-2 ${
                          isActive ? 'text-purple-700 font-medium' : 'text-gray-700'
                        }`
                      }
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Admin
                    </NavLink>
                  )}
                  
                  <button 
                    onClick={handleLogout}
                    className="flex items-center w-full py-2 text-red-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2">
                  <NavLink
                    to="/login"
                    className={({ isActive }) => 
                      `flex items-center py-2 ${
                        isActive ? 'text-orange-900 font-medium' : 'text-gray-700'
                      }`
                    }
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Login
                  </NavLink>
                  
                  <NavLink
                    to="/register"
                    className={({ isActive }) => 
                      `flex items-center py-2 ${
                        isActive ? 'text-orange-900 font-medium' : 'text-gray-700'
                      }`
                    }
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Register
                  </NavLink>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Spacer to prevent content from hiding behind the fixed navbar */}
      <div className="h-14 md:h-20"></div>
    </>
  );
}