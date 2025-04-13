import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CommentItem from "./CommentItem";
import PostMenu from "./PostMenu";
import GuestPrompt from "./GuestPrompt";

// Sample posts for guest mode
const SAMPLE_POSTS = [
  {
    _id: 'sample-post-1',
    content: 'Welcome to Buzzly! This is a sample post to give you an idea of how the platform works. Create an account to start sharing your own posts!',
    createdAt: new Date().toISOString(),
    likes: Array(15).fill(null),
    comments: [
      {
        _id: 'sample-comment-1',
        content: 'Great post! Buzzly is amazing for connecting with friends.',
        author: {
          _id: 'sample-user-3',
          username: 'SocialButterfly',
          profilePicture: 'https://randomuser.me/api/portraits/women/23.jpg'
        },
        createdAt: new Date().toISOString(),
        likes: Array(3).fill(null)
      }
    ],
    author: {
      _id: 'sample-user-1',
      username: 'BuzzlyTeam',
      profilePicture: 'https://randomuser.me/api/portraits/men/41.jpg'
    }
  },
  {
    _id: 'sample-post-2',
    content: 'Just finished hiking at the Grand Canyon! The views were absolutely breathtaking. Highly recommend visiting if you haven\'t been!',
    image: 'https://images.unsplash.com/photo-1527333656061-ca7adf608ae1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    likes: Array(42).fill(null),
    comments: [
      {
        _id: 'sample-comment-2',
        content: 'That view is amazing! I need to plan a trip there.',
        author: {
          _id: 'sample-user-4',
          username: 'TravelEnthusiast',
          profilePicture: 'https://randomuser.me/api/portraits/women/45.jpg'
        },
        createdAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
        likes: Array(7).fill(null)
      }
    ],
    author: {
      _id: 'sample-user-2',
      username: 'AdventureSeeker',
      profilePicture: 'https://randomuser.me/api/portraits/men/32.jpg'
    }
  },
  {
    _id: 'sample-post-3',
    content: 'Just baked these chocolate chip cookies from my grandmother\'s secret recipe. They turned out perfect!',
    image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    likes: Array(29).fill(null),
    comments: [
      {
        _id: 'sample-comment-3',
        content: 'They look delicious! Would you mind sharing the recipe?',
        author: {
          _id: 'sample-user-5',
          username: 'FoodLover',
          profilePicture: 'https://randomuser.me/api/portraits/women/65.jpg'
        },
        createdAt: new Date(Date.now() - 129600000).toISOString(), // 1.5 days ago
        likes: Array(4).fill(null)
      }
    ],
    author: {
      _id: 'sample-user-6',
      username: 'BakingQueen',
      profilePicture: 'https://randomuser.me/api/portraits/women/17.jpg'
    }
  }
];


const CustomFeed = () => {
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [postImage, setPostImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [promptAction, setPromptAction] = useState("");
  const fileInputRef = useRef(null);
  const { token, user, isGuestMode } = useAuth();

  useEffect(() => {
    if (isGuestMode) {
      // For guest mode, use sample posts
      setPosts(SAMPLE_POSTS);
      setLoading(false);
    } else {
      fetchPosts();
    }
  }, [token, isGuestMode]); // Update dependencies

  const fetchPosts = async () => {
    try {
      const response = await fetch('http://localhost:5050/posts', {
        headers: {
          'x-auth-token': token
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setPosts(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert("Please select a valid image file (JPEG, PNG, or GIF)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB");
      return;
    }

    setPostImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setPostImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async () => {
    if (!postImage) return null;
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', postImage);

      const response = await fetch('http://localhost:5050/posts/upload-image', {
        method: 'POST',
        headers: {
          'x-auth-token': token
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Error uploading image');
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    
    if (!newPostContent.trim() && !postImage) {
      alert("Please add some text or an image to your post");
      return;
    }
    
    try {
      let imageUrl = null;
      
      if (postImage) {
        imageUrl = await uploadImage();
        if (!imageUrl && !newPostContent.trim()) return; // If image upload failed and no text
      }
      
      const response = await fetch('http://localhost:5050/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ 
          content: newPostContent,
          image: imageUrl
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const newPost = await response.json();
      setPosts([newPost, ...posts]);
      setNewPostContent('');
      setPostImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleLike = async (postId) => {
    try {
      await fetch(`http://localhost:5050/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'x-auth-token': token
        }
      });
      
      // Refresh posts to show updated likes
      fetchPosts();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

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
      fetchPosts();
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

    posts.map((post) => (
      <PostItem key={post._id} post={post} isGuestMode={isGuestMode} />
    ))
    
    // Function to update a comment in the posts state
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
      if (!commentToReply || !commentToReply.author) return;
      
      // Set comment input to include the @username tag
      setComment(`@${commentToReply.author.username} `);
      
      // Ensure comments are visible
      setShowComments(true);
      
      // Focus the comment input
      setTimeout(() => {
        if (commentInputRef.current) {
          commentInputRef.current.focus();
        }
      }, 0);
    };

    // Start editing the post
    const handleEditPost = () => {
      setIsEditing(true);
      setEditedContent(post.content || "");
      
      // Focus the textarea after a short delay
      setTimeout(() => {
        if (editTextareaRef.current) {
          editTextareaRef.current.focus();
        }
      }, 0);
    };

    // Save the edited post
    const handleSaveEdit = async () => {
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
        
        // Refresh posts to show the updated content
        fetchPosts();
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
      <div className="bg-white rounded-lg shadow p-4 mb-4">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <img 
            src={post.author?.profilePicture || "/default-avatar.jpg"} 
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
        
        {/* Add Post Menu */}
        <PostMenu 
          post={post} 
          onPostDeleted={handlePostDeleted} 
          onEditPost={handleEditPost}
        />
      </div>
      
      {/* Post Content */}
      {isEditing ? (
        <div className="mb-3">
          <textarea
            ref={editTextareaRef}
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-600"
            rows="3"
            placeholder="What's on your mind?"
          ></textarea>
          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        post.content && (
          <p className="text-gray-800 mb-3">{post.content}</p>
        )
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
          className={`flex-1 flex items-center justify-center py-1 ${isLiked ? 'text-blue-600' : 'text-gray-500'} hover:bg-gray-50 rounded`}
        >
          <span className="mr-1">👍</span> 
          <span className={`${isLiked ? 'font-bold' : ''}`}>Like</span> ({post.likes?.length || 0})
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
                ref={commentInputRef}
              />
              <button
                type="submit"
                className="px-3 bg-orange-900 text-white rounded-r-md"
              >
                Post
              </button>
            </form>
            
            {/* Comments List */}
            <div className="space-y-2">
              {post.comments && post.comments.length > 0 ? (
                post.comments.map((comment) => (
                  <CommentItem
                    key={comment._id}
                    comment={comment}
                    postId={post._id}
                    onCommentUpdate={handleCommentUpdate}
                    onReply={handleReplyToComment}
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

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Your Feed</h1>
      
      {/* Create Post Form */}
  {isGuestMode ? (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex items-start">
        <img 
          src={user?.profilePicture || "/guest-avatar.jpg"} 
          alt={user?.username || "Guest"} 
          className="h-10 w-10 rounded-full object-cover mr-3"
        />
        <div 
          className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed" 
          onClick={() => {
            setPromptAction("create posts");
            setShowGuestPrompt(true);
          }}
        >
          <p className="text-gray-500">What's on your mind?</p>
        </div>
      </div>
      <div className="flex justify-between items-center mt-2">
        <div className="opacity-50 cursor-not-allowed">
          <button 
            className="flex items-center text-gray-600 bg-gray-100 px-3 py-1.5 rounded-md"
            onClick={(e) => {
              e.preventDefault();
              setPromptAction("create posts");
              setShowGuestPrompt(true);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Add Image
          </button>
        </div>
        <button
          onClick={() => {
            setPromptAction("create posts");
            setShowGuestPrompt(true);
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Create Account to Post
        </button>
      </div>
    </div>
  ) : (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex items-start mb-3">
        <img 
          src={user?.profilePicture || "/default-avatar.jpg"} 
          alt={user?.username || "You"} 
          className="h-10 w-10 rounded-full object-cover mr-3"
        />
        <form onSubmit={handlePostSubmit} className="w-full">
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="What's on your mind?"
            rows="3"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
          ></textarea>
          
          {/* Image Preview */}
          {imagePreview && (
            <div className="mt-2 relative">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full max-h-64 object-contain rounded-md"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white rounded-full p-1 hover:bg-opacity-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
          
          <div className="flex justify-between items-center mt-2">
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
                accept="image/*"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center text-gray-600 bg-gray-100 px-3 py-1.5 rounded-md hover:bg-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Add Image
              </button>
            </div>
            <button
              type="submit"
              disabled={uploading || (!newPostContent.trim() && !postImage)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </span> : 
                "Post"
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )}
      
      {/* Posts List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        posts.length > 0 ? (
          posts.map((post) => (
            <PostItem key={post._id} post={post} />
          ))
        ) : (
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-gray-500">No posts yet. Be the first to post!</p>
          </div>
        )
      )}
      {/* Guest Prompt Modal */}
      <GuestPrompt 
        isOpen={showGuestPrompt} 
        onClose={() => setShowGuestPrompt(false)}
        action={promptAction}
      />
    </div>
  );
};

export default CustomFeed;