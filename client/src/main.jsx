import * as React from "react";
import * as ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import App from "./App";
import Login from "./components/Login";
import Register from "./components/Register";
import Feed from "./components/Feed";
import CustomProfile from "./components/Profile"; // Make sure this matches the export name
import Search from "./components/Search";
import Settings from "./components/Settings";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute"; // Import the new AdminRoute component
import AdminPanel from "./components/AdminPanel"; // Import the AdminPanel component
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import SinglePost from "./components/SinglePost";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: (
          <ProtectedRoute>
            <Feed />
          </ProtectedRoute>
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