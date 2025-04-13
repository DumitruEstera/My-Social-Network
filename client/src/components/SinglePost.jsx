import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CommentItem from "./CommentItem";
import PostMenu from "./PostMenu";

export default function SinglePost() {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const { token, user } = useAuth();
  const { id } = useParams(); // Get post ID from URL
  const navigate = useNavigate();
  const commentInputRef = useRef(null);
  const editTextareaRef = useRef(null);

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

  // First, add this new function after handleCommentUpdate
  const handleCommentDelete = async (commentId) => {
    try {
      // Remove the comment from the post state immediately for a responsive UI
      setPost(prevPost => {
        if (!prevPost || !prevPost.comments) return prevPost;
        
        return {
          ...prevPost,
          comments: prevPost.comments.filter(comment => comment._id !== commentId)
        };
      });
    } catch (error) {
      console.error("Error handling comment deletion:", error);
    }
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

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-900"></div>
          <p className="mt-4 text-orange-900">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="bg-red-50 p-6 rounded-xl shadow-md mb-6 text-red-700 border border-red-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-center font-medium">{error || "Post not found"}</p>
        </div>
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-orange-900 hover:text-yellow-600 font-medium transition mx-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          Go back
        </button>
      </div>
    );
  }

  const isLiked = Array.isArray(post.likes) && user && post.likes.some(id => id === user._id);

  return (
    <div className="max-w-3xl mx-auto py-6">
      <button 
        onClick={() => navigate(-1)} 
        className="mb-6 inline-flex items-center text-orange-900 hover:text-yellow-600 transition font-medium"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
        </svg>
        Back
      </button>

      <div className="bg-white rounded-xl shadow-md border border-amber-50 overflow-hidden">
        {/* Post Header */}
        <div className="flex items-center justify-between p-5 border-b border-amber-50">
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
          
          {/* Add Post Menu */}
          <PostMenu 
            post={post} 
            onPostDeleted={() => navigate('/', { replace: true })}
            onEditPost={handleEditPost}
          />
        </div>
        
        {/* Post Content */}
        <div className="p-5">
          {isEditing ? (
            <div className="mb-4">
              <textarea
                ref={editTextareaRef}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                rows="4"
                placeholder="What's on your mind?"
              ></textarea>
              <div className="flex justify-end space-x-2 mt-3">
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
              <p className="text-gray-800 mb-5 leading-relaxed text-lg">{post.content}</p>
            )
          )}
          
          {/* Post Image (if any) */}
          {post.image && (
            <div className="mb-5 rounded-lg overflow-hidden">
              <img 
                src={post.image} 
                alt="Post content" 
                className="w-full h-auto rounded-lg shadow-sm"
                style={{ maxHeight: '600px', objectFit: 'contain' }}
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
          <div className="flex border-t border-b border-amber-50 py-2 mb-5">
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
              className="flex-1 flex items-center justify-center py-2 text-gray-600 hover:bg-gray-50 rounded-lg ml-1 transition"
              onClick={() => commentInputRef.current?.focus()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Comment
            </button>
          </div>
          
          {/* Comments Section */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-orange-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Comments
            </h3>
            
            {/* Add Comment Form */}
            <form 
              onSubmit={handleCommentSubmit} 
              className="flex mb-5"
            >
              <input
                id="comment-input"
                ref={commentInputRef}
                type="text"
                placeholder="Write a comment..."
                className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <button
                type="submit"
                className="px-4 bg-orange-900 text-white rounded-r-lg hover:bg-yellow-600 transition"
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
                  postAuthorId={post.author?._id} // Add this prop
                  onCommentUpdate={handleCommentUpdate}
                  onCommentDelete={handleCommentDelete}
                  onReply={handleReplyToComment}
                />
              ))
            ) : (
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <p className="text-gray-500 text-sm">No comments yet. Be the first to comment!</p>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}