import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isGuestMode, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Show loading indicator while checking authentication status
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Allow access if user is authenticated or in guest mode
  if (!isAuthenticated && !isGuestMode) {
    // Redirect to login page if not authenticated and not in guest mode
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}