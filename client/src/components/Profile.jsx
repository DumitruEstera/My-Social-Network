import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Post from "./Post";

export default function Profile() {
  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState("");
  const { user, token } = useAuth();
  const { id } = useParams();
  
  const userId = id || user?._id;
  const isOwnProfile = !id || id === user?._id;

  // Fetch profile data
  useEffect(() => {
    async function fetchProfileData() {
      if (!userId) return;
      
      try {
        const response = await fetch(`http://localhost:5050/users/${userId}`, {
          headers: {
            "x-auth-token": token
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setProfileData(data);
        setBio(data.bio || "");
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    }

    async function fetchUserPosts() {
      if (!userId) return;
      
      try {
        const response = await fetch(`http://localhost:5050/posts/user/${userId}`, {
          headers: {
            "x-auth-token": token
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfileData();
    fetchUserPosts();
  }, [userId, token]);

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!profileData || isOwnProfile) return;
    
    try {
      const response = await fetch(`http://localhost:5050/users/${profileData._id}/follow`, {
        method: "POST",
        headers: {
          "x-auth-token": token
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setProfileData(prevData => ({
        ...prevData,
        followers: data.followers
      }));
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async () => {
    try {
      const response = await fetch(`http://localhost:5050/users/${user._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token
        },
        body: JSON.stringify({ bio })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setProfileData(prevData => ({
        ...prevData,
        bio: data.bio
      }));
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold">User not found</h2>
      </div>
    );
  }

  // Check if current user is following this profile
  const isFollowing = user && profileData.followers?.includes(user._id);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex items-center gap-6">
          <img 
            src={profileData.profilePicture || "https://via.placeholder.com/100"} 
            alt={profileData.username} 
            className="h-24 w-24 rounded-full"
          />
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{profileData.username}</h1>
            <p className="text-gray-500">{profileData.email}</p>
            
            <div className="flex gap-4 mt-2">
              <div>
                <span className="font-semibold">{posts.length}</span> posts
              </div>
              <div>
                <span className="font-semibold">{profileData.followers?.length || 0}</span> followers
              </div>
              <div>
                <span className="font-semibold">{profileData.following?.length || 0}</span> following
              </div>
            </div>
          </div>
          
          {!isOwnProfile && (
            <button
              onClick={handleFollowToggle}
              className={`px-4 py-2 rounded-md ${
                isFollowing 
                  ? 'bg-gray-200 hover:bg-gray-300 text-gray-800' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          )}
        </div>
        
        {/* Bio Section */}
        <div className="mt-4">
          {isEditing ? (
            <div>
              <textarea
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600"
                placeholder="Write something about yourself..."
                rows="3"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              ></textarea>
              <div className="flex justify-end mt-2 gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setBio(profileData.bio || "");
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProfileUpdate}
                  className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-800">{profileData.bio || "No bio yet."}</p>
              {isOwnProfile && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-indigo-600 text-sm mt-2 hover:underline"
                >
                  Edit bio
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* User Posts */}
      <h2 className="text-xl font-semibold mb-4">Posts</h2>
      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map((post) => (
            <Post key={post._id} post={post} />
          ))
        ) : (
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <p className="text-gray-500">No posts yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}