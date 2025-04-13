import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function FollowersModal({ isOpen, onClose, type, userId, title }) {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { token, user: currentUser } = useAuth();

  useEffect(() => {
    if (isOpen && userId) {
      fetchUsers();
    }
  }, [isOpen, userId, type]);

  // Reset search and filtered users when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setFilteredUsers([]);
    }
  }, [isOpen]);

  // Filter users when search query changes
  useEffect(() => {
    if (users.length > 0) {
      if (!searchQuery.trim()) {
        setFilteredUsers(users);
      } else {
        const query = searchQuery.toLowerCase();
        const filtered = users.filter(user => 
          user.username.toLowerCase().includes(query) || 
          (user.bio && user.bio.toLowerCase().includes(query))
        );
        setFilteredUsers(filtered);
      }
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      
      const endpoint = `/users/${userId}/${type === 'followers' ? 'followers' : 'following'}`;
      const response = await fetch(`http://localhost:5050${endpoint}`, {
        headers: {
          "x-auth-token": token
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
      setError(`Unable to load ${type}. Please try again later.`);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (targetUserId) => {
    try {
      const response = await fetch(`http://localhost:5050/users/${targetUserId}/follow`, {
        method: "POST",
        headers: {
          "x-auth-token": token
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Update the UI to reflect the new follow status
      await fetchUsers();
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
    }
  };

  // Check if a user is being followed by the current user
  const isFollowing = (targetUserId) => {
    if (!currentUser || !currentUser.following) return false;
    return currentUser.following.some(id => 
      typeof id === 'string' ? id === targetUserId : id.toString() === targetUserId
    );
  };

  // Clear search query
  const clearSearch = () => {
    setSearchQuery("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col border border-amber-100">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-amber-50">
          <h2 className="text-xl font-semibold text-gray-900">{title || (type === 'followers' ? 'Followers' : 'Following')}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-orange-900 transition"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Search input */}
        <div className="px-4 py-3 border-b border-amber-50">
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder={`Search ${type}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-orange-900 transition"
                aria-label="Clear search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-100 border-t-4 border-t-orange-900"></div>
                <p className="mt-4 text-orange-900 font-medium">Loading...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-amber-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-600 mb-1">
                {users.length === 0 
                  ? (type === 'followers' ? 'No followers yet' : 'Not following anyone yet')
                  : `No ${type} found matching "${searchQuery}"`}
              </p>
              {users.length === 0 && (
                <p className="text-orange-900 font-medium">
                  {type === 'followers' ? 'Be active to gain followers!' : 'Start following interesting people!'}
                </p>
              )}
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredUsers.map(user => (
                <li key={user._id} className="flex items-center justify-between p-3 hover:bg-amber-50 rounded-lg transition border border-amber-50">
                  <Link 
                    to={`/profile/${user._id}`}
                    className="flex items-center flex-1"
                    onClick={onClose}
                  >
                    <img 
                      src={user.profilePicture || "/default-avatar.jpg"} 
                      alt={user.username} 
                      className="h-12 w-12 rounded-full object-cover mr-3 border-2 border-amber-100 shadow-sm"
                    />
                    <div>
                      <h3 className="font-medium text-gray-900">{user.username}</h3>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">
                        {user.bio || "No bio yet"}
                      </p>
                    </div>
                  </Link>
                  
                  {user._id !== currentUser?._id && (
                    <button
                      onClick={() => handleFollowToggle(user._id)}
                      className={`ml-2 px-4 py-1.5 text-sm rounded-lg font-medium transition ${
                        isFollowing(user._id)
                          ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                          : 'bg-orange-900 hover:bg-yellow-600 text-white'
                      }`}
                    >
                      {isFollowing(user._id) ? 'Unfollow' : 'Follow'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}