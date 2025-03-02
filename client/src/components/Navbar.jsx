import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div>
      <nav className="flex justify-between items-center mb-6">
        <NavLink to="/" className="text-2xl font-bold text-indigo-600">
          ConnectU
        </NavLink>
        
        <div className="flex gap-3 items-center">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-gray-700">
                Welcome, {user?.username || 'User'}
              </span>
              
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