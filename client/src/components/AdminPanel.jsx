import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FollowerNetwork from './FollowerNetwork';

export default function AdminPanel() {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [followerStats, setFollowerStats] = useState(null);
  const [loading, setLoading] = useState(false);
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
      <div className="flex border-b mb-6">
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