import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FollowerNetwork from './FollowerNetwork';

export default function AdminPanel() {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [followerStats, setFollowerStats] = useState(null);
  const [excessivePosters, setExcessivePosters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPosters, setLoadingPosters] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [activeTab, setActiveTab] = useState('users');

  // Fetch initial stats and data
  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchFollowerStats();
  }, [token]);

  // Fetch admin stats
  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5050/admin/stats', {
        headers: {
          'x-auth-token': token
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load statistics');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load statistics');
    }
  };

  // Fetch follower statistics
  const fetchFollowerStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5050/admin/follower-stats', {
        headers: {
          'x-auth-token': token
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load follower statistics');
      }

      const data = await response.json();
      setFollowerStats(data);
    } catch (err) {
      console.error('Error fetching follower stats:', err);
      setError('Failed to load follower statistics');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch excessive posters (spam users)
  const fetchExcessivePosters = async () => {
    try {
      setLoadingPosters(true);
      setError('');
      
      const response = await fetch('http://localhost:5050/admin/excessive-posters', {
        headers: {
          'x-auth-token': token
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load excessive posters data');
      }

      const data = await response.json();
      setExcessivePosters(data);
    } catch (err) {
      console.error('Error fetching excessive posters:', err);
      setError('Failed to load excessive posters data');
    } finally {
      setLoadingPosters(false);
    }
  };

  // Fetch users (recent users if no search query)
  const fetchUsers = async (query = '') => {
    setLoading(true);
    setError('');
    
    try {
      const endpoint = `http://localhost:5050/admin/users/search${query ? `?q=${encodeURIComponent(query)}` : ''}`;
      const response = await fetch(endpoint, {
        headers: {
          'x-auth-token': token
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load users');
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(searchQuery);
  };

  // Handle block/unblock user
  const handleToggleBlock = async (userId, currentBlockedStatus) => {
    setActionLoading(true);
    setStatusMessage('');
    
    try {
      const response = await fetch(`http://localhost:5050/admin/users/${userId}/toggle-block`, {
        method: 'PATCH',
        headers: {
          'x-auth-token': token
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to update user status');
      }

      const data = await response.json();
      
      // Update users list with the new blocked status
      setUsers(users.map(user => 
        user._id === userId ? { ...user, blocked: data.blocked } : user
      ));
      
      // If we have excessive posters and one of them is updated
      if (excessivePosters.length > 0) {
        setExcessivePosters(excessivePosters.map(item => 
          item.user._id === userId 
            ? { ...item, user: { ...item.user, blocked: data.blocked } } 
            : item
        ));
      }
      
      // Set success message
      setStatusMessage(`User ${data.blocked ? 'blocked' : 'unblocked'} successfully`);
      
      // Refresh stats
      fetchStats();
      fetchFollowerStats();
    } catch (err) {
      console.error('Error updating user:', err);
      setStatusMessage(err.message || 'An error occurred. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Format date with time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Fetch data when tab changes
  useEffect(() => {
    if (activeTab === 'excessive-posters') {
      fetchExcessivePosters();
    }
  }, [activeTab]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
      
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-600">Total Users</h3>
            <p className="text-3xl font-bold">{stats.totalUsers}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-600">Active Users</h3>
            <p className="text-3xl font-bold text-green-600">{stats.activeUsers}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-600">Blocked Users</h3>
            <p className="text-3xl font-bold text-red-600">{stats.blockedUsers}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-600">New Users (7d)</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.newUsers}</p>
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <div className="flex border-b mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`py-2 px-4 font-medium ${
            activeTab === 'users'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-indigo-600'
          }`}
        >
          User Management
        </button>
        <button
          onClick={() => setActiveTab('excessive-posters')}
          className={`py-2 px-4 font-medium ${
            activeTab === 'excessive-posters'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-indigo-600'
          }`}
        >
          Spam Detection
        </button>
        <button
          onClick={() => setActiveTab('top-accounts')}
          className={`py-2 px-4 font-medium ${
            activeTab === 'top-accounts'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-indigo-600'
          }`}
        >
          Top Accounts
        </button>
        <button
          onClick={() => setActiveTab('follower-network')}
          className={`py-2 px-4 font-medium ${
            activeTab === 'follower-network'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-indigo-600'
          }`}
        >
          Follower Network
        </button>
      </div>
      
      {/* User Management Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">User Management</h2>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex">
              <input
                type="text"
                placeholder="Search users by username or email..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700"
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
          
          {/* Status Message */}
          {statusMessage && (
            <div className={`mb-4 p-3 rounded-md ${
              statusMessage.includes('successfully') 
                ? 'bg-green-50 text-green-700' 
                : 'bg-red-50 text-red-700'
            }`}>
              {statusMessage}
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-700 uppercase text-sm">
                  <th className="py-3 px-4 text-left">User</th>
                  <th className="py-3 px-4 text-left">Email</th>
                  <th className="py-3 px-4 text-left">Joined</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-4 text-center text-gray-500">
                      {searchQuery ? 'No users found matching your search.' : 'No users found.'}
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <img 
                            src={user.profilePicture || "/default-avatar.jpg"} 
                            alt={user.username} 
                            className="h-10 w-10 rounded-full object-cover mr-3"
                          />
                          <div>
                            <p className="font-medium">{user.username}</p>
                            {user.isAdmin && (
                              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                                Admin
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{user.email}</td>
                      <td className="py-3 px-4 text-gray-600">{formatDate(user.created_at)}</td>
                      <td className="py-3 px-4">
                        {user.isAdmin ? (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                            Administrator
                          </span>
                        ) : user.blocked ? (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                            Blocked
                          </span>
                        ) : (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {user.isAdmin ? (
                          <span className="text-xs text-gray-500">Admin users cannot be blocked</span>
                        ) : (
                          <button
                            onClick={() => handleToggleBlock(user._id, user.blocked)}
                            disabled={actionLoading}
                            className={`text-sm px-3 py-1 rounded-md ${
                              user.blocked
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            {user.blocked ? 'Unblock' : 'Block'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Spam Detection Tab */}
      {activeTab === 'excessive-posters' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Spam Detection</h2>
          <p className="text-gray-500 mb-6">
            Users who have posted more than 5 posts today - this could indicate spamming behavior.
          </p>
          
          {loadingPosters ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : excessivePosters.length === 0 ? (
            <div className="bg-green-50 text-green-700 p-4 rounded-md">
              No users have posted excessively today. Your community is behaving well!
            </div>
          ) : (
            <div className="space-y-6">
              {excessivePosters.map((item) => (
                <div key={item.user._id} className="border rounded-lg overflow-hidden">
                  {/* User Header */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
                    <div className="flex items-center">
                      <img 
                        src={item.user.profilePicture || "/default-avatar.jpg"} 
                        alt={item.user.username} 
                        className="h-10 w-10 rounded-full object-cover mr-3"
                      />
                      <div>
                        <p className="font-medium">{item.user.username}</p>
                        <p className="text-xs text-gray-500">{item.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {item.postCount} posts today
                      </span>
                      {!item.user.isAdmin && (
                        <button
                          onClick={() => handleToggleBlock(item.user._id, item.user.blocked)}
                          disabled={actionLoading}
                          className={`text-sm px-3 py-1 rounded-md ${
                            item.user.blocked
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {item.user.blocked ? 'Unblock User' : 'Block User'}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Recent Posts */}
                  <div className="p-4">
                    <h3 className="font-medium text-gray-700 mb-2">Recent Posts Sample:</h3>
                    <div className="space-y-3">
                      {item.latestPosts.map((post) => (
                        <div key={post._id} className="p-3 bg-gray-50 rounded-md">
                          <p className="text-gray-800">
                            {post.content ? (
                              post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content
                            ) : (
                              <span className="text-gray-500 italic">No text content (image post)</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Posted at {formatDateTime(post.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3">
                      <Link
                        to={`/profile/${item.user._id}`}
                        className="text-indigo-600 hover:underline text-sm"
                      >
                        View Full Profile & Posts
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Top Accounts Tab */}
      {activeTab === 'top-accounts' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Top Accounts by Followers</h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : !followerStats ? (
            <div className="py-8 text-center text-gray-500">
              No follower statistics available.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 uppercase text-sm">
                    <th className="py-3 px-4 text-left">Rank</th>
                    <th className="py-3 px-4 text-left">User</th>
                    <th className="py-3 px-4 text-left">Followers</th>
                    <th className="py-3 px-4 text-left">Following</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {followerStats.topUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-4 text-center text-gray-500">
                        No users with followers found.
                      </td>
                    </tr>
                  ) : (
                    followerStats.topUsers.map((user, index) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-semibold">{index + 1}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <img 
                              src={user.profilePicture || "/default-avatar.jpg"} 
                              alt={user.username} 
                              className="h-10 w-10 rounded-full object-cover mr-3"
                            />
                            <div>
                              <p className="font-medium">{user.username}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold">{user.followerCount}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span>{user.followingCount}</span>
                        </td>
                        <td className="py-3 px-4">
                          {user.isAdmin ? (
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                              Admin
                            </span>
                          ) : user.blocked ? (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                              Blocked
                            </span>
                          ) : (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            to={`/profile/${user._id}`}
                            className="text-indigo-600 hover:underline text-sm mr-3"
                          >
                            View Profile
                          </Link>
                          
                          {!user.isAdmin && (
                            <button
                              onClick={() => handleToggleBlock(user._id, user.blocked)}
                              disabled={actionLoading}
                              className={`text-sm px-2 py-1 rounded-md ${
                                user.blocked
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              }`}
                            >
                              {user.blocked ? 'Unblock' : 'Block'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {/* Follower Network Tab */}
      {activeTab === 'follower-network' && (
        <FollowerNetwork 
          followerStats={followerStats} 
          loading={loading} 
        />
      )}
    </div>
  );
}