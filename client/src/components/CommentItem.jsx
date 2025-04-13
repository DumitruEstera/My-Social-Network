import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formatCommentWithMentions, findUserByUsernameAndNavigate } from "../utils/MentionUtils";
import GuestPrompt from "./GuestPrompt";

export default function CommentItem({ 
  comment: initialComment, 
  postId, 
  postAuthorId, // Add this prop to know who authored the post
  onCommentUpdate, 
  onReply, 
  isGuestMode, 
  onCommentDelete 
}) {
  const { token, user } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [localLikes, setLocalLikes] = useState(initialComment.likes || []);
  const [isLiked, setIsLiked] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [promptAction, setPromptAction] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const deleteConfirmRef = useRef(null);
  
  // Initialize component state when comment changes
  useEffect(() => {
    // Initialize likes array if it doesn't exist
    const commentLikes = initialComment.likes || [];
    setLocalLikes(commentLikes);
    
    // Check if user has liked this comment
    if (user) {
      const liked = commentLikes.some(id => id === user._id);
      setIsLiked(liked);
    }
  }, [initialComment, user]);

  // Handle click outside for delete confirmation
  useEffect(() => {
    function handleClickOutside(event) {
      if (deleteConfirmRef.current && !deleteConfirmRef.current.contains(event.target)) {
        setShowDeleteConfirm(false);
      }
    }

    if (showDeleteConfirm) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDeleteConfirm]);
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Handle like/unlike
  const handleLike = async () => {
    if (isGuestMode) {
      setPromptAction("like comments");
      setShowGuestPrompt(true);
      return;
    }
    
    if (isLiking || !user) return;
    
    setIsLiking(true);
    
    try {
      const response = await fetch(
        `http://localhost:5050/posts/${postId}/comments/${initialComment._id}/like`, 
        {
          method: 'POST',
          headers: {
            'x-auth-token': token
          }
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const updatedComment = await response.json();
      
      // Update local state directly for immediate feedback
      if (!isLiked) {
        // Add user's ID to likes
        setLocalLikes(prev => [...prev, user._id]);
      } else {
        // Remove user's ID from likes
        setLocalLikes(prev => prev.filter(id => id !== user._id));
      }
      
      setIsLiked(!isLiked);
      
      // Call the callback to update the parent component
      if (onCommentUpdate) {
        onCommentUpdate(updatedComment);
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      alert('Error liking comment. Please try again.');
    } finally {
      setIsLiking(false);
    }
  };

  // Handle reply click
  const handleReply = () => {
    if (isGuestMode) {
      setPromptAction("reply to comments");
      setShowGuestPrompt(true);
      return;
    }
    
    if (onReply) {
      onReply(initialComment);
    }
  };

  // Check if the current user can delete this comment
  const canDeleteComment = () => {
    if (!user) return false;
    
    // User can delete if they authored the comment
    const isCommentAuthor = initialComment.author?._id === user._id;
    
    // Or if they authored the post this comment is on
    const isPostAuthor = postAuthorId === user._id;
    
    return isCommentAuthor || isPostAuthor;
  };

  // Handle delete confirmation click
  const handleDeleteClick = () => {
    if (isGuestMode) {
      setPromptAction("delete comments");
      setShowGuestPrompt(true);
      return;
    }
    
    setShowDeleteConfirm(true);
  };

  // Handle actual delete
  const handleDelete = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(
        `http://localhost:5050/posts/${postId}/comments/${initialComment._id}`,
        {
          method: 'DELETE',
          headers: {
            'x-auth-token': token
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Call the callback to remove the comment from the parent component
      if (onCommentDelete) {
        onCommentDelete(initialComment._id);
      }
      
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Error deleting comment. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle username click in mentions
  const handleUsernameClick = (username) => {
    findUserByUsernameAndNavigate(username, token, navigate);
  };
  
  return (
    <div className="flex p-3 bg-amber-50 rounded-lg mb-2 border border-amber-100">
      <img 
        src={initialComment.author?.profilePicture || "/default-avatar.jpg"} 
        alt={initialComment.author?.username || "User"} 
        className="h-9 w-9 rounded-full object-cover mr-3 border-2 border-amber-100 shadow-sm"
      />
      <div className="flex-1">
        <div className="flex items-baseline gap-2 justify-between">
          <div className="flex items-baseline gap-2">
            <Link 
              to={`/profile/${initialComment.author?._id}`} 
              className="font-medium text-gray-900 hover:text-orange-900 transition"
            >
              {initialComment.author?.username || "Unknown User"}
            </Link>
            <span className="text-xs text-gray-500">
              {formatDate(initialComment.createdAt)}
            </span>
          </div>
          
          {canDeleteComment() && (
            <button 
              onClick={handleDeleteClick}
              className="text-gray-400 hover:text-red-500 transition"
              aria-label="Delete comment"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
        
        <p className="text-gray-800 text-sm leading-relaxed mt-1">
          {formatCommentWithMentions(initialComment.content, handleUsernameClick)}
        </p>
        
        {/* Like button and count */}
        <div className="flex items-center mt-2">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center text-xs ${
              isLiked ? 'text-orange-900' : 'text-gray-500'
            } hover:text-orange-900 disabled:opacity-50 transition`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 mr-1" 
              fill={isLiked ? "currentColor" : "none"} 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              strokeWidth={isLiked ? 0 : 2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            <span>{isLiked ? 'Liked' : 'Like'}</span>
            {localLikes.length > 0 && (
              <span className="ml-1">({localLikes.length})</span>
            )}
          </button>

          {/* Reply button */}
          <button
            onClick={handleReply}
            className="flex items-center text-xs text-gray-500 hover:text-orange-900 ml-4 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 mr-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            <span>Reply</span>
          </button>
        </div>
      </div>

      {/* Delete confirmation popup */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDeleteConfirm(false)}>
          <div 
            ref={deleteConfirmRef}
            className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Comment</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to delete this comment? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
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