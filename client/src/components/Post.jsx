import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CommentItem from "./CommentItem";
import PostMenu from "./PostMenu";
import GuestPrompt from "./GuestPrompt";

export default function Post({ post: initialPost, onPostDeleted }) {
  const [post, setPost] = useState(initialPost);
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [promptAction, setPromptAction] = useState("");
  const { token, user, isGuestMode, isGenuineUser } = useAuth();
  const commentInputRef = useRef(null);
  const editTextareaRef = useRef(null);

  // Initialize isLiked state based on user's likes
  useEffect(() => {
    if (user && post.likes) {
      const userLiked = post.likes.some(id => id === user._id);
      setIsLiked(userLiked);
    }
  }, [user, post.likes]);

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle like
  const handleLike = async () => {
    if (isGuestMode) {
      setPromptAction("like posts");
      setShowGuestPrompt(true);
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5050/posts/${post._id}/like`, {
        method: "POST",
        headers: {
          "x-auth-token": token
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Fetch the updated post data
      await refreshPostData();
      // Toggle isLiked state
      setIsLiked(!isLiked);
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  // Refresh the post data from the server
  const refreshPostData = async () => {
    try {
      const response = await fetch(`http://localhost:5050/posts/${post._id}`, {
        headers: {
          "x-auth-token": token
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const updatedPost = await response.json();
      setPost(updatedPost);
    } catch (error) {
      console.error("Error refreshing post:", error);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (isGuestMode) {
      setPromptAction("comment on posts");
      setShowGuestPrompt(true);
      return;
    }
    
    if (!newComment.trim()) return;
    
    try {
      await fetch(`http://localhost:5050/posts/${post._id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token
        },
        body: JSON.stringify({ content: newComment })
      });
      
      // Refresh post to get the updated comment list with full data
      await refreshPostData();
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // Handle comment update (e.g., when a comment is liked)
  const handleCommentUpdate = (updatedComment) => {
    // Update the post state with the updated comment
    setPost(prevPost => ({
      ...prevPost,
      comments: prevPost.comments.map(comment => 
        comment._id === updatedComment._id ? updatedComment : comment
      )
    }));
  };

  // Handle reply to a comment
  const handleReplyToComment = (commentToReply) => {
    if (isGuestMode) {
      setPromptAction("reply to comments");
      setShowGuestPrompt(true);
      return;
    }
    
    if (!commentToReply || !commentToReply.author) return;
    
    // Set comment input to include the @username tag
    setNewComment(`@${commentToReply.author.username} `);
    
    // Ensure comments are visible
    setShowComments(true);
    
    // Focus the comment input
    setTimeout(() => {
      if (commentInputRef.current) {
        commentInputRef.current.focus();
      }
    }, 0);
  };

  // Handle post deletion
  const handlePostDeleted = () => {
    if (onPostDeleted) {
      onPostDeleted(post._id);
    }
  };

  // Start editing a post
  const handleEditPost = () => {
    setIsEditing(true);
    setEditedContent(post.content || "");
    
    // Focus the textarea after a short delay to allow for rendering
    setTimeout(() => {
      if (editTextareaRef.current) {
        editTextareaRef.current.focus();
      }
    }, 0);
  };

  // Save edited post
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
      
      const updatedPost = await response.json();
      setPost(updatedPost);
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

  // Show comment input when user clicks on comment button
  const handleCommentClick = () => {
    if (isGuestMode) {
      setPromptAction("comment on posts");
      setShowGuestPrompt(true);
      return;
    }
    
    setShowComments(!showComments);
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
            <p className="text-xs text-gray-500">{formatDate(post.createdAt || new Date())}</p>
          </div>
        </div>
        
        {/* Post Menu (three dots) - Only show for the post author and not in guest mode */}
        {isGenuineUser && user?._id === post.author?._id && (
          <PostMenu 
            post={post} 
            onPostDeleted={handlePostDeleted} 
            onEditPost={handleEditPost}
          />
        )}
      </div>
      
      {/* Post Content */}
      <div className="mb-4">
        {isEditing ? (
          <div>
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
            <p className="text-gray-800 leading-relaxed">{post.content}</p>
          )
        )}
      </div>
      
      {/* Post Image (if any) */}
      {post.image && (
        <div className="mb-4 rounded-lg overflow-hidden">
          <img 
            src={post.image} 
            alt="Post" 
            className="w-full h-auto rounded-lg shadow-sm"
            style={{ maxHeight: '500px', objectFit: 'contain' }}
          />
        </div>
      )}
      
      {/* Post Stats */}
      <div className="flex items-center text-sm text-gray-500 mb-2">
        <span className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-orange-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {post.likes?.length || 0} likes
        </span>
        <span className="mx-2">•</span>
        <span className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-orange-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          {post.comments?.length || 0} comments
        </span>
      </div>
      
      {/* Post Actions */}
      <div className="flex border-t border-b border-amber-50 py-2 mb-3">
        <button 
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center py-2 rounded-lg mr-1 transition ${
            isLiked ? 'text-orange-900 bg-amber-50 font-medium' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isLiked ? 0 : 2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          <span>{isLiked ? 'Liked' : 'Like'}</span>
        </button>
        <button 
          onClick={handleCommentClick}
          className="flex-1 flex items-center justify-center py-2 text-gray-600 hover:bg-gray-50 rounded-lg ml-1 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Comment
        </button>
      </div>
      
      {/* Comments Section */}
      {showComments && (
        <div>
          {/* Comment Form - Only show for logged in users */}
          {!isGuestMode && (
            <form onSubmit={handleCommentSubmit} className="flex mb-4">
              <input
                type="text"
                placeholder="Write a comment..."
                className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
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
          
          {/* Guest Comment Message - Only show for guest users */}
          {isGuestMode && (
            <div className="bg-amber-50 text-gray-700 p-4 mb-4 rounded-lg border border-amber-100 flex items-center justify-between">
              <span className="text-gray-700">Sign in to add a comment</span>
              <button
                onClick={() => {
                  setPromptAction("comment on posts");
                  setShowGuestPrompt(true);
                }}
                className="px-4 py-2 bg-orange-900 text-white rounded-lg hover:bg-yellow-600 transition text-sm"
              >
                Create Account
              </button>
            </div>
          )}
          
          {/* Comments List */}
          <div className="space-y-3">
            {post.comments && post.comments.length > 0 ? (
              post.comments.map((comment) => (
                <CommentItem
                  key={comment._id}
                  comment={comment}
                  postId={post._id}
                  onCommentUpdate={handleCommentUpdate}
                  onReply={handleReplyToComment}
                  isGuestMode={isGuestMode}
                />
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Guest Prompt Modal */}
      <GuestPrompt 
        isOpen={showGuestPrompt} 
        onClose={() => setShowGuestPrompt(false)}
        action={promptAction}
      />
    </div>
  );
}