import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationDropdown from "./NotificationDropdown";

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="mb-8">
      <nav className="flex flex-col md:flex-row justify-between items-center gap-4 py-4 border-b border-amber-100">
        <NavLink to="/" className="text-3xl font-bold text-orange-900 hover:text-yellow-600 transition">
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
              
              <NavLink 
                className={({ isActive }) => 
                  `inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm transition ${
                    isActive 
                      ? 'bg-orange-900 text-white' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`
                }
                to="/"
              >
                Feed
              </NavLink>
              
              <NavLink 
                className={({ isActive }) => 
                  `inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm transition ${
                    isActive 
                      ? 'bg-orange-900 text-white' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`
                }
                to={`/profile/${user?._id}`}
              >
                My Profile
              </NavLink>
              
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
      </nav>
    </div>
  );
}