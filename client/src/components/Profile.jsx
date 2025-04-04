import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function CustomProfile() {
  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);
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

  // Handle profile picture upload
  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setUploadError("Please select a valid image file (JPEG, PNG, or GIF)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size should be less than 5MB");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('http://localhost:5050/users/profilePicture', {
        method: 'POST',
        headers: {
          'x-auth-token': token
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Error uploading profile picture');
      }

      const data = await response.json();
      
      setProfileData(prevData => ({
        ...prevData,
        profilePicture: data.profilePicture
      }));
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setUploadError(error.message || 'Error uploading profile picture');
    } finally {
      setUploading(false);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle like
  const handleLike = async (postId) => {
    try {
      await fetch(`http://localhost:5050/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'x-auth-token': token
        }
      });
      
      // Refresh posts to show updated likes
      const response = await fetch(`http://localhost:5050/posts/user/${userId}`, {
        headers: {
          "x-auth-token": token
        }
      });
      
      if (response.ok) {
        const updatedPosts = await response.json();
        setPosts(updatedPosts);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  // Handle comment
  const handleComment = async (postId, comment) => {
    if (!comment.trim()) return;
    
    try {
      await fetch(`http://localhost:5050/posts/${postId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ content: comment })
      });
      
      // Refresh posts to show new comment
      const response = await fetch(`http://localhost:5050/posts/user/${userId}`, {
        headers: {
          "x-auth-token": token
        }
      });
      
      if (response.ok) {
        const updatedPosts = await response.json();
        setPosts(updatedPosts);
      }
    } catch (error) {
      console.error('Error commenting on post:', error);
    }
  };

  const PostItem = ({ post }) => {
    const [comment, setComment] = useState('');
    const [showComments, setShowComments] = useState(false);
    
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        {/* Post Header */}
        <div className="flex items-center mb-3">
          <img 
            src={post.author?.profilePicture || "https://via.placeholder.com/40"} 
            alt={post.author?.username || "User"} 
            className="h-10 w-10 rounded-full object-cover mr-3"
          />
          <div>
            <Link 
              to={`/profile/${post.author?._id}`} 
              className="font-medium text-gray-900 hover:underline"
            >
              {post.author?.username || "Unknown User"}
            </Link>
            <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
          </div>
        </div>
        
        {/* Post Content */}
        {post.content && (
          <p className="text-gray-800 mb-3">{post.content}</p>
        )}
        
        {/* Post Image (if any) */}
        {post.image && (
          <div className="mb-3">
            <img src={post.image} alt="Post content" className="w-full rounded-lg" />
          </div>
        )}
        
        {/* Post Actions */}
        <div className="flex border-t border-b py-2 mb-3">
          <button 
            onClick={() => handleLike(post._id)}
            className="flex-1 flex items-center justify-center py-1 text-gray-500 hover:bg-gray-50 rounded"
          >
            <span className="mr-1">👍</span> Like ({post.likes?.length || 0})
          </button>
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex-1 flex items-center justify-center py-1 text-gray-500 hover:bg-gray-50 rounded"
          >
            <span className="mr-1">💬</span> Comment ({post.comments?.length || 0})
          </button>
        </div>
        
        {/* Comments Section */}
        {showComments && (
          <div>
            {/* Add Comment Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleComment(post._id, comment);
                setComment('');
              }} 
              className="flex mb-3"
            >
              <input
                type="text"
                placeholder="Write a comment..."
                className="flex-1 p-2 border border-gray-300 rounded-l-md"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <button
                type="submit"
                className="px-3 bg-indigo-600 text-white rounded-r-md"
              >
                Post
              </button>
            </form>
            
            {/* Comments List */}
            <div className="space-y-2">
              {post.comments && post.comments.length > 0 ? (
                post.comments.map((comment, index) => (
                  <div key={index} className="flex p-2 bg-gray-50 rounded">
                    <img 
                      src={comment.author?.profilePicture || "https://via.placeholder.com/30"} 
                      alt={comment.author?.username || "User"} 
                      className="h-8 w-8 rounded-full object-cover mr-2"
                    />
                    <div>
                      <div className="flex items-baseline gap-2">
                        <Link 
                          to={`/profile/${comment.author?._id}`} 
                          className="font-medium text-gray-900 hover:underline"
                        >
                          {comment.author?.username || "Unknown User"}
                        </Link>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-800 text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center">No comments yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
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
  const isFollowing = user && profileData.followers?.some(
    followerId => followerId.toString() === user._id
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <img 
              src={profileData.profilePicture || "https://via.placeholder.com/100"} 
              alt={profileData.username} 
              className="h-24 w-24 rounded-full object-cover"
            />
            
            {isOwnProfile && (
              <div className="absolute bottom-0 right-0">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleProfilePictureUpload}
                  className="hidden"
                  accept="image/*"
                />
                <button 
                  onClick={triggerFileInput}
                  disabled={uploading}
                  className="bg-indigo-600 text-white p-1 rounded-full hover:bg-indigo-700 shadow"
                  title="Change profile picture"
                >
                  {uploading ? (
                    <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>
          
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
            
            {uploadError && (
              <p className="text-red-500 text-sm mt-1">{uploadError}</p>
            )}
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
            <PostItem key={post._id} post={post} />
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