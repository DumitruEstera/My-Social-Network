import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import GuestPrompt from "./GuestPrompt";

export default function Settings() {
  // Existing state for password changes
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  
  // New state for username changes
  const [currentUsername, setCurrentUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState("");
  const [usernameLoading, setUsernameLoading] = useState(false);
  
  // Add state for guest prompt
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [promptAction, setPromptAction] = useState("");
  
  const { user, token, changePassword, isGuestMode, updateUser } = useAuth(); // Add updateUser
  const navigate = useNavigate();

  // Set current username when user data loads
  useEffect(() => {
    if (user) {
      setCurrentUsername(user.username || "");
    }
  }, [user]);

  // Handle password change (existing function)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user is in guest mode
    if (isGuestMode) {
      setPromptAction("change your password");
      setShowGuestPrompt(true);
      return;
    }
    
    setError("");
    setSuccess("");
    
    // Basic validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await changePassword(currentPassword, newPassword);
      if (result.success) {
        setSuccess("Password updated successfully");
        // Clear form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(result.message || "Failed to update password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // New function to handle username change
  const handleUsernameChange = async (e) => {
    e.preventDefault();
    
    if (isGuestMode) {
      setPromptAction("change your username");
      setShowGuestPrompt(true);
      return;
    }
    
    setUsernameError("");
    setUsernameSuccess("");
    
    // Basic validation
    if (!newUsername.trim()) {
      setUsernameError("Username is required");
      return;
    }
    
    // Don't allow same username
    if (newUsername === currentUsername) {
      setUsernameError("New username must be different from current username");
      return;
    }
    
    setUsernameLoading(true);
    
    try {
      const response = await fetch(`http://localhost:5050/users/${user._id}/username`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token
        },
        body: JSON.stringify({ username: newUsername })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.msg || "Failed to update username");
      }
      
      // Update the user context with the new username
      updateUser({
        username: data.username
      });
      
      setUsernameSuccess("Username updated successfully");
      setCurrentUsername(data.username);
      setNewUsername("");
    } catch (err) {
      setUsernameError(err.message || "An error occurred");
    } finally {
      setUsernameLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-orange-900 mb-2">Account Settings</h1>
        <p className="text-yellow-600 italic">Manage your account preferences and security</p>
      </div>
      
      {/* Username Change Section - New */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-6 border border-amber-50">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">Change Username</h2>
        
        {usernameError && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200 flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{usernameError}</span>
          </div>
        )}
        
        {usernameSuccess && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 border border-green-200 flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{usernameSuccess}</span>
          </div>
        )}
        
        {/* Guest mode message */}
        {isGuestMode && (
          <div className="bg-amber-50 text-gray-700 p-5 rounded-lg mb-6 border border-amber-100">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>You're browsing in guest mode. Create an account to manage your profile settings.</p>
            </div>
          </div>
        )}
        
        <form onSubmit={handleUsernameChange} className="space-y-5">
          <div>
            <label 
              htmlFor="currentUsername" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Current Username
            </label>
            <input
              type="text"
              id="currentUsername"
              value={currentUsername}
              disabled
              className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>
          
          <div>
            <label 
              htmlFor="newUsername" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              New Username
            </label>
            <input
              type="text"
              id="newUsername"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              placeholder="Enter new username"
            />
          </div>
          
          <div className="pt-2">
            <button
              type="submit"
              disabled={usernameLoading}
              className="w-full flex justify-center items-center py-3 px-4 rounded-lg bg-orange-900 hover:bg-yellow-600 text-white font-medium shadow-sm transition duration-200 disabled:opacity-50"
            >
              {usernameLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating Username...
                </>
              ) : (
                "Update Username"
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Password Change Section (Existing) */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-6 border border-amber-50">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">Change Password</h2>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200 flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 border border-green-200 flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{success}</span>
          </div>
        )}
        
        {/* Guest mode message */}
        {isGuestMode && (
          <div className="bg-amber-50 text-gray-700 p-5 rounded-lg mb-6 border border-amber-100">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>You're browsing in guest mode. Create an account to manage your profile settings.</p>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label 
              htmlFor="currentPassword" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            />
          </div>
          
          <div>
            <label 
              htmlFor="newPassword" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            />
            <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters</p>
          </div>
          
          <div>
            <label 
              htmlFor="confirmPassword" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            />
          </div>
          
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 rounded-lg bg-orange-900 hover:bg-yellow-600 text-white font-medium shadow-sm transition duration-200 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating Password...
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Additional Account Settings Section (Keep existing) */}
      <div className="bg-white rounded-xl shadow-md p-8 border border-amber-50">
        <h2 className="text-xl font-semibold mb-2 text-gray-800">Account Information</h2>
        <p className="text-gray-500 mb-4">These are your account details and preferences.</p>
        
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div>
              <p className="text-sm text-gray-500">Want to update your profile information?</p>
              <p className="text-gray-700 font-medium">Edit your bio, change profile picture, and more.</p>
            </div>
            <button 
              onClick={() => navigate(`/profile/${user?._id}`)}
              className="px-4 py-2 bg-orange-900 text-white rounded-lg hover:bg-yellow-600 transition text-sm"
            >
              Go to Profile
            </button>
          </div>
        </div>
      </div>

      {/* Guest Prompt Modal */}
      <GuestPrompt 
        isOpen={showGuestPrompt} 
        onClose={() => setShowGuestPrompt(false)}
        action={promptAction}
      />
    </div>
  );
}