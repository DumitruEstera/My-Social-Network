import * as React from "react";
import * as ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useLocation
} from "react-router-dom";
import App from "./App";
import Login from "./components/Login";
import Register from "./components/Register";
import Feed from "./components/Feed";
import CustomProfile from "./components/Profile";
import Search from "./components/Search";
import Settings from "./components/Settings";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminPanel from "./components/AdminPanel";
import { AuthProvider, useAuth } from "./context/AuthContext"; // Make sure to import useAuth here
import { NotificationProvider } from "./context/NotificationContext";
import SinglePost from "./components/SinglePost";
import "./index.css";

// This component needs to be defined after the useAuth import
function RequiresAuthOrGuest({ children }) {
  const { isAuthenticated, isGuestMode } = useAuth();
  const location = useLocation();

  if (!isAuthenticated && !isGuestMode) {
    // If not authenticated and not in guest mode, redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function RequiresAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // If not authenticated, redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: (
          <RequiresAuth>
            <Feed />
          </RequiresAuth>
        ),
      },
      {
        path: "/feed",
        element: (
          <RequiresAuthOrGuest>
            <Feed />
          </RequiresAuthOrGuest>
        ),
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/register",
        element: <Register />,
      },
      {
        path: "/profile/:id",
        element: (
          <ProtectedRoute>
            <CustomProfile />
          </ProtectedRoute>
        ),
      },
      {
        path: "/search",
        element: (
          <ProtectedRoute>
            <Search />
          </ProtectedRoute>
        ),
      },
      {
        path: "/post/:id",
        element: (
          <ProtectedRoute>
            <SinglePost />
          </ProtectedRoute>
        ),
      },
      {
        path: "/settings",
        element: (
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin",
        element: (
          <AdminRoute>
            <AdminPanel />
          </AdminRoute>
        ),
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <RouterProvider router={router} />
      </NotificationProvider>
    </AuthProvider>
  </React.StrictMode>
);