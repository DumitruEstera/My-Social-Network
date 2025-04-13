import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CommentItem from "./CommentItem";
import PostMenu from "./PostMenu";
import GuestPrompt from "./GuestPrompt"; // Import the new component

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
    <div className="bg-white p-4 rounded-lg shadow">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <img 
            src={post.author?.profilePicture || "/default-avatar.jpg"} 
            alt={post.author?.username || "User"} 
            className="h-10 w-10 rounded-full object-cover mr-3"
          />
          <div>
            <Link to={`/profile/${post.author?._id}`} className="font-medium text-gray-900 hover:underline">
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
      <div className="mb-3">
        {isEditing ? (
          <div>
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
          <p className="text-gray-800">{post.content}</p>
        )}
      </div>
      
      {/* Post Image (if any) */}
      {post.image && (
        <div className="mb-3">
          <img src={post.image} alt="Post" className="w-full rounded-lg" />
        </div>
      )}
      
      {/* Post Stats */}
      <div className="flex items-center text-sm text-gray-500 mb-2">
        <span>{post.likes?.length || 0} likes</span>
        <span className="mx-2">•</span>
        <span>{post.comments?.length || 0} comments</span>
      </div>
      
      {/* Post Actions */}
      <div className="flex border-t border-b py-2 mb-3">
        <button 
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center py-1 ${isLiked ? 'text-blue-600' : 'text-gray-500'} hover:bg-gray-50 rounded`}
          >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          <span className={`${isLiked ? 'font-bold' : ''}`}>Like</span>
        </button>
        <button 
          onClick={handleCommentClick}
          className="flex-1 flex items-center justify-center py-1 text-gray-500 hover:bg-gray-50 rounded"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <form onSubmit={handleCommentSubmit} className="flex mb-3">
              <input
                type="text"
                placeholder="Write a comment..."
                className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-indigo-600"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                ref={commentInputRef}
              />
              <button
                type="submit"
                className="px-3 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              >
                Post
              </button>
            </form>
          )}
          
          {/* Guest Comment Message - Only show for guest users */}
          {isGuestMode && (
            <div className="bg-gray-50 text-gray-700 p-3 mb-3 rounded-md border border-gray-200 flex items-center justify-between">
              <span>Sign in to add a comment</span>
              <button
                onClick={() => {
                  setPromptAction("comment on posts");
                  setShowGuestPrompt(true);
                }}
                className="text-indigo-600 font-medium hover:text-indigo-800"
              >
                Create Account
              </button>
            </div>
          )}
          
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
                  isGuestMode={isGuestMode}
                />
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center">No comments yet. Be the first to comment!</p>
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