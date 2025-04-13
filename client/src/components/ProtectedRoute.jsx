import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isGuestMode, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Show loading indicator with the orange/amber color scheme
    return (
      <div className="flex justify-center items-center h-screen bg-amber-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-amber-100 border-t-4 border-t-orange-900"></div>
          <p className="mt-4 text-orange-900 font-medium">Loading...</p>
        </div>
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