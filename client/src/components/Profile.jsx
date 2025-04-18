import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CommentItem from "./CommentItem";
import FollowersModal from "./FollowersModal";
import PhotoGallery from "./PhotoGallery"; 
import PostMenu from "./PostMenu";
import GuestPrompt from "./GuestPrompt";

// Sample data for guest profile preview
const SAMPLE_GUEST_PROFILE = {
  _id: 'guest',
  username: 'Guest User',
  email: 'guest@example.com',
  profilePicture: '/guest-avatar.jpg',
  bio: 'This is a preview of the profile page in guest mode. Create an account to customize your own profile!',
  followers: Array(8).fill(null),
  following: Array(12).fill(null),
  created_at: new Date().toISOString()
};

// Sample posts for guest profile preview
const SAMPLE_GUEST_POSTS = [
  {
    _id: 'sample-guest-post-1',
    content: 'Just joined Buzzly! Excited to connect with everyone here.',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
    likes: Array(24).fill(null),
    comments: [
      {
        _id: 'sample-comment-1',
        content: 'Welcome! You\'ll love it here.',
        author: {
          _id: 'sample-user-3',
          username: 'SocialButterfly',
          profilePicture: 'https://randomuser.me/api/portraits/women/23.jpg'
        },
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        likes: Array(3).fill(null)
      }
    ],
    author: {
      _id: 'guest',
      username: 'Guest User',
      profilePicture: '/guest-avatar.jpg'
    }
  },
  {
    _id: 'sample-guest-post-2',
    content: 'Check out this amazing sunset from yesterday!',
    image: 'https://images.unsplash.com/photo-1502790671504-542ad42d5189?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    likes: Array(42).fill(null),
    comments: [
      {
        _id: 'sample-comment-2',
        content: 'Stunning view! Where was this taken?',
        author: {
          _id: 'sample-user-4',
          username: 'NatureExplorer',
          profilePicture: 'https://randomuser.me/api/portraits/men/45.jpg'
        },
        createdAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
        likes: Array(7).fill(null)
      }
    ],
    author: {
      _id: 'guest',
      username: 'Guest User',
      profilePicture: '/guest-avatar.jpg'
    }
  },
  {
    _id: 'sample-guest-post-3',
    content: 'Just finished reading this amazing book. Highly recommend!',
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), // 7 days ago
    likes: Array(18).fill(null),
    comments: [],
    author: {
      _id: 'guest',
      username: 'Guest User',
      profilePicture: '/guest-avatar.jpg'
    }
  }
];

export default function CustomProfile() {
  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(""); 
  const [activeTab, setActiveTab] = useState("posts"); 
  
  // Add state for guest prompt
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [promptAction, setPromptAction] = useState("");
  
  const fileInputRef = useRef(null);
  const { user, token, isGuestMode } = useAuth(); 
  const { id } = useParams();
  
  const userId = id || user?._id;
  const isOwnProfile = !id || id === user?._id;

  // Fetch profile data
  useEffect(() => {
    async function fetchProfileData() {
      if (isGuestMode) {
        setProfileData(SAMPLE_GUEST_PROFILE);
        setBio(SAMPLE_GUEST_PROFILE.bio || "");
        return;
      }
      
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
      if (isGuestMode) {
        setPosts(SAMPLE_GUEST_POSTS);
        setLoading(false);
        return;
      }
      
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
  }, [userId, token, isGuestMode]);

  // Handle opening the followers/following modal
  const openModal = (type) => {
    if (isGuestMode) {
      setPromptAction(`view ${type}`);
      setShowGuestPrompt(true);
      return;
    }
    
    setModalType(type);
    setModalOpen(true);
  };

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (isGuestMode) {
      setPromptAction("follow users");
      setShowGuestPrompt(true);
      return;
    }
    
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
    if (isGuestMode) {
      setPromptAction("update your profile");
      setShowGuestPrompt(true);
      return;
    }
    
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
    if (isGuestMode) {
      setPromptAction("update your profile picture");
      setShowGuestPrompt(true);
      return;
    }
    
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
    if (isGuestMode) {
      setPromptAction("update your profile picture");
      setShowGuestPrompt(true);
      return;
    }
    
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
    if (isGuestMode) {
      setPromptAction("like posts");
      setShowGuestPrompt(true);
      return;
    }
    
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
    if (isGuestMode) {
      setPromptAction("comment on posts");
      setShowGuestPrompt(true);
      return;
    }
    
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

  const handlePostDeleted = (postId) => {
    setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
  };

  const PostItem = ({ post }) => {
    const [comment, setComment] = useState('');
    const [showComments, setShowComments] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState('');
    const isLiked = Array.isArray(post.likes) && user && post.likes.some(id => id === user._id);
    const commentInputRef = useRef(null);
    const editTextareaRef = useRef(null);
    
    const handleCommentUpdate = (updatedComment) => {
      setPosts(prevPosts => 
        prevPosts.map(p => {
          if (p._id !== post._id) return p;
          
          return {
            ...p,
            comments: p.comments.map(c => 
              c._id === updatedComment._id ? updatedComment : c
            )
          };
        })
      );
    };

    // Handle reply to a comment
    const handleReplyToComment = (commentToReply) => {
      if (isGuestMode) {
        setPromptAction("reply to comments");
        setShowGuestPrompt(true);
        return;
      }
      
      if (!commentToReply || !commentToReply.author) return;
      
      setComment(`@${commentToReply.author.username} `);
      
      setShowComments(true);
      
      setTimeout(() => {
        if (commentInputRef.current) {
          commentInputRef.current.focus();
        }
      }, 0);
    };

    const handleCommentDelete = async (commentId) => {
      try {
        setPosts(prevPosts => 
          prevPosts.map(p => {
            if (p._id !== post._id) return p;
            
            return {
              ...p,
              comments: p.comments.filter(c => c._id !== commentId)
            };
          })
        );
      } catch (error) {
        console.error("Error handling comment deletion:", error);
      }
    };

    // Start editing the post
    const handleEditPost = () => {
      if (isGuestMode) {
        setPromptAction("edit posts");
        setShowGuestPrompt(true);
        return;
      }
      
      setIsEditing(true);
      setEditedContent(post.content || "");
      
      setTimeout(() => {
        if (editTextareaRef.current) {
          editTextareaRef.current.focus();
        }
      }, 0);
    };

    // Save the edited post
    const handleSaveEdit = async () => {
      if (isGuestMode) {
        setPromptAction("edit posts");
        setShowGuestPrompt(true);
        return;
      }
      
      if (!editedContent.trim()) {
        alert("Post content cannot be empty");
        return;
      }
      
      try {
        const response = await fetch(`http://localhost:5050/posts/${post._id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token
          },
          body: JSON.stringify({ content: editedContent })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Refresh user posts
        const refreshResponse = await fetch(`http://localhost:5050/posts/user/${userId}`, {
          headers: {
            "x-auth-token": token
          }
        });
        
        if (refreshResponse.ok) {
          const updatedPosts = await refreshResponse.json();
          setPosts(updatedPosts);
        }
        
        setIsEditing(false);
      } catch (error) {
        console.error("Error updating post:", error);
        alert("Failed to update post. Please try again.");
      }
    };

    // Cancel editing
    const handleCancelEdit = () => {
      setIsEditing(false);
      setEditedContent("");
    };

    return (
      <div className="bg-white rounded-xl shadow-md p-5 mb-5 border border-amber-50 transition duration-300 hover:shadow-lg">
        {/* Post Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <img 
              src={post.author?.profilePicture || "/default-avatar.jpg"} 
              alt={post.author?.username || "User"} 
              className="h-12 w-12 rounded-full object-cover border-2 border-amber-100 shadow-sm mr-3"
            />
            <div>
              <Link 
                to={`/profile/${post.author?._id}`} 
                className="font-semibold text-gray-900 hover:text-orange-900 transition"
              >
                {post.author?.username || "Unknown User"}
              </Link>
              <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
            </div>
          </div>
          
          {/* Add Post Menu - only for real users on their own posts */}
          {!isGuestMode && post.author?._id === user?._id && (
            <PostMenu 
              post={post} 
              onPostDeleted={handlePostDeleted}
              onEditPost={handleEditPost}
            />
          )}
        </div>
        
        {/* Post Content */}
        {isEditing ? (
          <div className="mb-4">
            <textarea
              ref={editTextareaRef}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              rows="3"
              placeholder="What's on your mind?"
            ></textarea>
            <div className="flex justify-end space-x-2 mt-2">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-orange-900 text-white rounded-lg hover:bg-yellow-600 transition"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          post.content && (
            <p className="text-gray-800 mb-4 leading-relaxed">{post.content}</p>
          )
        )}
        
        {/* Post Image (if any) */}
        {post.image && (
          <div className="mb-4 rounded-lg overflow-hidden">
            <img 
              src={post.image} 
              alt="Post content" 
              className="w-full h-auto rounded-lg shadow-sm object-cover"
              style={{ maxHeight: '500px', objectFit: 'contain' }}
            />
          </div>
        )}
        
        {/* Post Actions */}
        <div className="flex border-t border-b border-amber-50 py-2 mb-3">
          <button 
            onClick={() => handleLike(post._id)}
            className={`flex-1 flex items-center justify-center py-2 rounded-lg mr-1 transition ${
              isLiked ? 'text-orange-900 bg-amber-50 font-medium' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isLiked ? 0 : 2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            <span>Like</span> ({post.likes?.length || 0})
          </button>
          <button 
            onClick={() => {
              if (isGuestMode) {
                setPromptAction("comment on posts");
                setShowGuestPrompt(true);
                return;
              }
              setShowComments(!showComments);
            }}
            className="flex-1 flex items-center justify-center py-2 text-gray-600 hover:bg-gray-50 rounded-lg ml-1 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Comment</span> ({post.comments?.length || 0})
          </button>
        </div>
        
        {/* Comments Section */}
        {showComments && (
          <div>
            {isGuestMode ? (
              // Guest mode comment prompt
              <div className="bg-amber-50 p-4 rounded-lg mb-4 border border-amber-100">
                <p className="text-gray-700 text-sm mb-2">Create an account to add comments</p>
                <button
                  onClick={() => {
                    setPromptAction("comment on posts");
                    setShowGuestPrompt(true);
                  }}
                  className="px-4 py-2 bg-orange-900 text-white text-sm rounded-lg hover:bg-yellow-600 transition"
                >
                  Sign Up Now
                </button>
              </div>
            ) : (
              // Comment form for logged-in users
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
                  className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  ref={commentInputRef}
                />
                <button
                  type="submit"
                  className="px-4 bg-orange-900 text-white rounded-r-lg hover:bg-yellow-600 transition"
                >
                  Post
                </button>
              </form>
            )}
            
            {/* Comments List */}
            <div className="space-y-3">
            {post.comments && post.comments.length > 0 ? (
              post.comments.map((comment) => (
                <CommentItem
                  key={comment._id}
                  comment={comment}
                  postId={post._id}
                  postAuthorId={post.author?._id} // Add this prop
                  onCommentUpdate={handleCommentUpdate}
                  onCommentDelete={handleCommentDelete}
                  onReply={handleReplyToComment}
                  isGuestMode={isGuestMode}
                />
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
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-900"></div>
          <p className="mt-4 text-orange-900">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="text-center py-10 bg-white rounded-xl shadow-md border border-amber-50">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-yellow-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-xl font-semibold text-orange-900">User not found</h2>
      </div>
    );
  }

  // Check if current user is following this profile
  const isFollowing = !isGuestMode && user && profileData.followers?.some(
    followerId => {
      if (typeof followerId === 'string' && typeof user._id === 'string') {
        return followerId === user._id;
      }
      return followerId.toString() === user._id.toString();
    }
  );

  const photoCount = posts.filter(post => post.image).length;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white p-8 rounded-xl shadow-md mb-6 border border-amber-50">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative">
            <div className="h-36 w-36 rounded-full overflow-hidden border-4 border-amber-100 shadow-md">
              <img 
                src={profileData.profilePicture || "/default-avatar.jpg"} 
                alt={profileData.username} 
                className="h-full w-full object-cover"
              />
            </div>
            
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
                  className="bg-orange-900 text-white p-2 rounded-full hover:bg-yellow-600 shadow transition"
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
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-gray-900">{profileData.username}</h1>
            <p className="text-gray-500 mb-4">{profileData.email}</p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-6 mb-4">
              <div className="text-center">
                <span className="block text-2xl font-bold text-orange-900">{posts.length}</span>
                <span className="text-gray-600">posts</span>
              </div>
              <button 
                onClick={() => openModal('followers')}
                className="text-center hover:text-orange-900 focus:outline-none transition"
              >
                <span className="block text-2xl font-bold text-orange-900">{profileData.followers?.length || 0}</span>
                <span className="text-gray-600">followers</span>
              </button>
              <button 
                onClick={() => openModal('following')}
                className="text-center hover:text-orange-900 focus:outline-none transition"
              >
                <span className="block text-2xl font-bold text-orange-900">{profileData.following?.length || 0}</span>
                <span className="text-gray-600">following</span>
              </button>
            </div>
            
            {uploadError && (
              <p className="text-red-500 text-sm mt-1 mb-4">{uploadError}</p>
            )}
            
            {!isOwnProfile && (
              <button
                onClick={handleFollowToggle}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isFollowing 
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-800' 
                    : 'bg-orange-900 hover:bg-yellow-600 text-white'
                }`}
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </button>
            )}
            
            {isGuestMode && isOwnProfile && (
              <div className="mt-3 py-2 px-3 bg-amber-50 text-sm text-gray-700 rounded-lg border border-amber-100">
                Create an account to customize your profile and interact with others
              </div>
            )}
          </div>
        </div>
        
        {/* Bio Section */}
        <div className="mt-6 pt-6 border-t border-amber-50">
          {isEditing ? (
            <div>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                placeholder="Write something about yourself..."
                rows="3"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              ></textarea>
              <div className="flex justify-end mt-3 gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setBio(profileData.bio || "");
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProfileUpdate}
                  className="px-4 py-2 bg-orange-900 text-white rounded-lg hover:bg-yellow-600 transition"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Bio</h3>
              <p className="text-gray-800 leading-relaxed">{profileData.bio || "No bio yet."}</p>
              {isOwnProfile && (
                <button
                  onClick={() => {
                    if (isGuestMode) {
                      setPromptAction("edit your bio");
                      setShowGuestPrompt(true);
                      return;
                    }
                    setIsEditing(true);
                  }}
                  className="mt-3 text-orange-900 hover:text-yellow-600 text-sm font-medium transition"
                >
                  Edit bio
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Followers/Following Modal */}
      <FollowersModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalType}
        userId={userId}
        title={modalType === 'followers' ? 'Followers' : 'Following'}
      />
      
      {/* Content Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab("posts")}
          className={`flex-1 py-3 px-6 font-medium text-center transition ${
            activeTab === "posts"
              ? "text-orange-900 border-b-2 border-orange-900"
              : "text-gray-600 hover:text-orange-900"
          }`}
        >
          Posts
        </button>
        <button
          onClick={() => setActiveTab("photos")}
          className={`flex-1 py-3 px-6 font-medium text-center transition ${
            activeTab === "photos"
              ? "text-orange-900 border-b-2 border-orange-900"
              : "text-gray-600 hover:text-orange-900"
          }`}
        >
          Photos
          {photoCount > 0 && (
            <span className="ml-2 px-2.5 py-0.5 text-xs bg-orange-100 text-orange-800 rounded-full">
              {photoCount}
            </span>
          )}
        </button>
      </div>
      
      {/* Content based on active tab */}
      {activeTab === "posts" ? (
        <div className="space-y-5">
          {posts.length > 0 ? (
            posts.map((post) => (
              <PostItem key={post._id} post={post} />
            ))
          ) : (
            <div className="bg-white p-8 rounded-xl shadow-md text-center border border-amber-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-yellow-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <p className="text-gray-600 mb-2">No posts yet.</p>
              {isOwnProfile && (
                <p className="text-orange-900 font-medium">Share your first post!</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-6 border border-amber-50">
          <h2 className="text-xl font-semibold text-orange-900 mb-6">Photos</h2>
          <PhotoGallery posts={posts} isGuestMode={isGuestMode} />
        </div>
      )}
      
      {/* Guest Prompt */}
      <GuestPrompt 
        isOpen={showGuestPrompt} 
        onClose={() => setShowGuestPrompt(false)}
        action={promptAction}
      />
    </div>
  );
}