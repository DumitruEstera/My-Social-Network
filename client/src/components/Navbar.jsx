import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isAuthenticated, logout } = useAuth();
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
    <div>
      <nav className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
        <NavLink to="/" className="text-2xl font-bold text-indigo-600">
          Buzzly
        </NavLink>
        
        {isAuthenticated && (
          <form onSubmit={handleSearch} className="w-full md:w-1/3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                className="w-full py-2 px-4 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-indigo-600"
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
                  src={user?.profilePicture || "https://via.placeholder.com/32"} 
                  alt={user?.username || 'User'} 
                  className="h-8 w-8 rounded-full object-cover mr-2"
                />
                <span className="text-sm text-gray-700">
                  {user?.username || 'User'}
                </span>
              </div>
              
              <NavLink 
                className="inline-flex items-center justify-center whitespace-nowrap text-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-slate-100 h-9 rounded-md px-3" 
                to="/"
              >
                Feed
              </NavLink>
              
              <NavLink 
                className={({ isActive }) =>
                  `inline-flex items-center justify-center whitespace-nowrap text-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input ${
                    isActive ? 'bg-slate-100' : 'bg-background'
                  } hover:bg-slate-100 h-9 rounded-md px-3`
                }
                to={`/profile/${user?._id}`}
              >
                My Profile
              </NavLink>
              
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center whitespace-nowrap text-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-red-50 hover:bg-red-100 text-red-600 h-9 rounded-md px-3"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                className={({ isActive }) =>
                  `inline-flex items-center justify-center whitespace-nowrap text-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input ${
                    isActive ? 'bg-slate-100' : 'bg-background'
                  } hover:bg-slate-100 h-9 rounded-md px-3`
                }
                to="/login"
              >
                Login
              </NavLink>
              
              <NavLink
                className={({ isActive }) =>
                  `inline-flex items-center justify-center whitespace-nowrap text-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input ${
                    isActive ? 'bg-indigo-100' : 'bg-indigo-50'
                  } hover:bg-indigo-100 text-indigo-600 h-9 rounded-md px-3`
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