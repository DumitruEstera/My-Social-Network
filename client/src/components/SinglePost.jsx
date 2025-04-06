import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CommentItem from "./CommentItem";

export default function SinglePost() {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const { token, user } = useAuth();
  const { id } = useParams(); // Get post ID from URL
  const navigate = useNavigate();
  const commentInputRef = useRef(null);

  useEffect(() => {
    // Fetch single post data
    const fetchPost = async () => {
      try {
        const response = await fetch(`http://localhost:5050/posts/${id}`, {
          headers: {
            "x-auth-token": token
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setPost(data);
      } catch (err) {
        console.error("Error fetching post:", err);
        setError("Post not found or error loading post");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, token]);

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle like
  const handleLike = async () => {
    try {
      await fetch(`http://localhost:5050/posts/${id}/like`, {
        method: 'POST',
        headers: {
          'x-auth-token': token
        }
      });
      
      // Refresh post to show updated likes
      const response = await fetch(`http://localhost:5050/posts/${id}`, {
        headers: {
          "x-auth-token": token
        }
      });
      
      if (response.ok) {
        const updatedPost = await response.json();
        setPost(updatedPost);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!comment.trim()) return;
    
    try {
      await fetch(`http://localhost:5050/posts/${id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ content: comment })
      });
      
      // Refresh post to show new comment
      const response = await fetch(`http://localhost:5050/posts/${id}`, {
        headers: {
          "x-auth-token": token
        }
      });
      
      if (response.ok) {
        const updatedPost = await response.json();
        setPost(updatedPost);
        setComment("");
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Update a comment in the post state after it's been modified (e.g. liked)
  const handleCommentUpdate = (updatedComment) => {
    if (!post || !post.comments) return;
    
    const updatedComments = post.comments.map(comment => 
      comment._id === updatedComment._id ? updatedComment : comment
    );
    
    setPost(prevPost => ({
      ...prevPost,
      comments: updatedComments
    }));
  };

  // Handle reply to a comment
  const handleReplyToComment = (commentToReply) => {
    if (!commentToReply || !commentToReply.author) return;
    
    // Set comment input to include the @username tag
    setComment(`@${commentToReply.author.username} `);
    
    // Focus the comment input
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 p-4 rounded-lg shadow mb-4 text-red-700">
          {error || "Post not found"}
        </div>
        <button 
          onClick={() => navigate(-1)} 
          className="text-indigo-600 hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const isLiked = Array.isArray(post.likes) && user && post.likes.some(id => id === user._id);

  return (
    <div className="max-w-2xl mx-auto">
      <button 
        onClick={() => navigate(-1)} 
        className="mb-4 inline-flex items-center text-indigo-600 hover:underline"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="bg-white rounded-lg shadow p-4">
        {/* Post Header */}
        <div className="flex items-center mb-4">
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
          <p className="text-gray-800 mb-4">{post.content}</p>
        )}
        
        {/* Post Image (if any) */}
        {post.image && (
          <div className="mb-4">
            <img src={post.image} alt="Post content" className="w-full rounded-lg" />
          </div>
        )}
        
        {/* Post Stats */}
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <span>{post.likes?.length || 0} likes</span>
          <span className="mx-2">•</span>
          <span>{post.comments?.length || 0} comments</span>
        </div>
        
        {/* Post Actions */}
        <div className="flex border-t border-b py-2 mb-4">
          <button 
            onClick={handleLike}
            className={`flex-1 flex items-center justify-center py-1 ${isLiked ? 'text-blue-600' : 'text-gray-500'} hover:bg-gray-50 rounded`}
          >
            <span className="mr-1">👍</span> 
            <span className={`${isLiked ? 'font-bold' : ''}`}>Like</span>
          </button>
          <button 
            className="flex-1 flex items-center justify-center py-1 text-gray-500 hover:bg-gray-50 rounded"
            onClick={() => commentInputRef.current?.focus()}
          >
            <span className="mr-1">💬</span> Comment
          </button>
        </div>
        
        {/* Comments Section */}
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Comments</h3>
          
          {/* Add Comment Form */}
          <form 
            onSubmit={handleCommentSubmit} 
            className="flex mb-4"
          >
            <input
              id="comment-input"
              ref={commentInputRef}
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
          <div className="space-y-3">
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
              <p className="text-gray-500 text-sm text-center py-4">No comments yet. Be the first to comment!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}