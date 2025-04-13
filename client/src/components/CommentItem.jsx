import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formatCommentWithMentions, findUserByUsernameAndNavigate } from "../utils/MentionUtils";
import GuestPrompt from "./GuestPrompt";

export default function CommentItem({ comment: initialComment, postId, onCommentUpdate, onReply, isGuestMode }) {
  const { token, user } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [localLikes, setLocalLikes] = useState(initialComment.likes || []);
  const [isLiked, setIsLiked] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [promptAction, setPromptAction] = useState("");
  const navigate = useNavigate();
  
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

  // Handle username click in mentions
  const handleUsernameClick = (username) => {
    findUserByUsernameAndNavigate(username, token, navigate);
  };
  
  return (
    <div className="flex p-2 bg-gray-50 rounded mb-2">
      <img 
        src={initialComment.author?.profilePicture || "/default-avatar.jpg"} 
        alt={initialComment.author?.username || "User"} 
        className="h-8 w-8 rounded-full object-cover mr-2"
      />
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <Link 
            to={`/profile/${initialComment.author?._id}`} 
            className="font-medium text-gray-900 hover:underline"
          >
            {initialComment.author?.username || "Unknown User"}
          </Link>
          <span className="text-xs text-gray-500">
            {formatDate(initialComment.createdAt)}
          </span>
        </div>
        <p className="text-gray-800 text-sm">
          {formatCommentWithMentions(initialComment.content, handleUsernameClick)}
        </p>
        
        {/* Like button and count */}
        <div className="flex items-center mt-1">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center text-xs ${
              isLiked ? 'text-blue-600' : 'text-gray-500'
            } hover:text-blue-600 disabled:opacity-50`}
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
            className="flex items-center text-xs text-gray-500 hover:text-blue-600 ml-3"
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
      
      {/* Guest Prompt Modal */}
      <GuestPrompt 
        isOpen={showGuestPrompt} 
        onClose={() => setShowGuestPrompt(false)}
        action={promptAction}
      />
    </div>
  );
}