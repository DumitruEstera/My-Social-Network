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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">{title || (type === 'followers' ? 'Followers' : 'Following')}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Search input */}
        <div className="px-4 py-2 border-b">
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
              className="w-full py-2 pl-10 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center p-4">{error}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-gray-500 text-center p-4">
              {users.length === 0 
                ? (type === 'followers' ? 'No followers yet' : 'Not following anyone yet')
                : `No ${type} found matching "${searchQuery}"`}
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredUsers.map(user => (
                <li key={user._id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md">
                  <Link 
                    to={`/profile/${user._id}`}
                    className="flex items-center flex-1"
                    onClick={onClose}
                  >
                    <img 
                      src={user.profilePicture || "/default-avatar.jpg"} 
                      alt={user.username} 
                      className="h-10 w-10 rounded-full object-cover mr-3"
                    />
                    <div>
                      <h3 className="font-medium">{user.username}</h3>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">
                        {user.bio || "No bio"}
                      </p>
                    </div>
                  </Link>
                  
                  {user._id !== currentUser?._id && (
                    <button
                      onClick={() => handleFollowToggle(user._id)}
                      className={`ml-2 px-3 py-1 text-sm rounded-md ${
                        isFollowing(user._id)
                          ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
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