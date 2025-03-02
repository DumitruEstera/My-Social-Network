import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Post({ post }) {
  const [likes, setLikes] = useState(post.likes || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [newComment, setNewComment] = useState("");
  const { token, user } = useAuth();

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle like
  const handleLike = async () => {
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
      
      setLikes(prev => isLiked ? prev - 1 : prev + 1);
      setIsLiked(!isLiked);
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    try {
      const response = await fetch(`http://localhost:5050/posts/${post._id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token
        },
        body: JSON.stringify({ content: newComment })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const comment = await response.json();
      setComments([...comments, comment]);
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      {/* Post Header */}
      <div className="flex items-center mb-3">
        <img 
          src={post.author?.profilePicture || "https://via.placeholder.com/40"} 
          alt={post.author?.username || "User"} 
          className="h-10 w-10 rounded-full mr-3"
        />
        <div>
          <Link to={`/profile/${post.author?._id}`} className="font-medium text-gray-900 hover:underline">
            {post.author?.username || "Unknown User"}
          </Link>
          <p className="text-xs text-gray-500">{formatDate(post.createdAt || new Date())}</p>
        </div>
      </div>
      
      {/* Post Content */}
      <div className="mb-3">
        <p className="text-gray-800">{post.content}</p>
      </div>
      
      {/* Post Image (if any) */}
      {post.image && (
        <div className="mb-3">
          <img src={post.image} alt="Post" className="w-full rounded-lg" />
        </div>
      )}
      
      {/* Post Stats */}
      <div className="flex items-center text-sm text-gray-500 mb-2">
        <span>{likes} likes</span>
        <span className="mx-2">•</span>
        <span>{comments.length} comments</span>
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
          Like
        </button>
        <button 
          onClick={() => setShowComments(!showComments)}
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
          {/* Comment Form */}
          <form onSubmit={handleCommentSubmit} className="flex mb-3">
            <input
              type="text"
              placeholder="Write a comment..."
              className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-indigo-600"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button
              type="submit"
              className="px-3 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            >
              Post
            </button>
          </form>
          
          {/* Comments List */}
          <div className="space-y-2">
            {comments.length > 0 ? (
              comments.map((comment, index) => (
                <div key={index} className="flex p-2 bg-gray-50 rounded">
                  <img 
                    src={comment.author?.profilePicture || "https://via.placeholder.com/30"} 
                    alt={comment.author?.username || "User"} 
                    className="h-8 w-8 rounded-full mr-2"
                  />
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <Link to={`/profile/${comment.author?._id}`} className="font-medium text-gray-900 hover:underline">
                        {comment.author?.username || "Unknown User"}
                      </Link>
                      <span className="text-xs text-gray-500">{formatDate(comment.createdAt || new Date())}</span>
                    </div>
                    <p className="text-gray-800 text-sm">{comment.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center">No comments yet. Be the first to comment!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}