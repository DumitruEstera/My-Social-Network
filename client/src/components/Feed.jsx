import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CustomFeed = () => {
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [loading, setLoading] = useState(true);
  const { token, user } = useAuth();

  useEffect(() => {
    fetchPosts();
  }, [token]);

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

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    
    if (!newPostContent.trim()) return;
    
    try {
      const response = await fetch('http://localhost:5050/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ content: newPostContent })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const newPost = await response.json();
      setPosts([newPost, ...posts]);
      setNewPostContent('');
    } catch (error) {
      console.error('Error creating post:', error);
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
        <p className="text-gray-800 mb-3">{post.content}</p>
        
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

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Your Feed</h1>
      
      {/* Create Post Form */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-start mb-3">
          <img 
            src={user?.profilePicture || "https://via.placeholder.com/40"} 
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
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Post
              </button>
            </div>
          </form>
        </div>
      </div>
      
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
    </div>
  );
};

export default CustomFeed;