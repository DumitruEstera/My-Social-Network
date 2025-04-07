import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PostMenu from "./PostMenu";

export default function PhotoGallery({ posts, onPostDeleted }) {
  const [activePhoto, setActivePhoto] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const navigate = useNavigate();
  const { token } = useAuth();
  const editTextareaRef = useRef(null);
  
  // Filter posts to include only those with images - do this inline without useState/useEffect
  const postsWithImages = posts.filter(post => post.image);
  
  // Open modal with larger image
  const openPhotoModal = (post) => {
    setActivePhoto(post);
    // Reset editing state when opening a new photo
    setIsEditing(false);
    setEditedContent("");
  };
  
  // Close the modal
  const closePhotoModal = () => {
    setActivePhoto(null);
    setIsEditing(false);
    setEditedContent("");
  };
  
  // Handle post deletion
  const handlePostDeleted = (postId) => {
    // Close the modal if the active photo is deleted
    if (activePhoto && activePhoto._id === postId) {
      setActivePhoto(null);
    }
    
    // Call the parent's onPostDeleted if provided
    if (onPostDeleted) {
      onPostDeleted(postId);
    }
  };

  // Start editing the post
  const handleEditPost = () => {
    if (!activePhoto) return;

    setIsEditing(true);
    setEditedContent(activePhoto.content || "");
    
    // Focus the textarea after a short delay
    setTimeout(() => {
      if (editTextareaRef.current) {
        editTextareaRef.current.focus();
      }
    }, 0);
  };

  // Save edited post content
  const handleSaveEdit = async () => {
    if (!activePhoto) return;

    try {
      const response = await fetch(`http://localhost:5050/posts/${activePhoto._id}`, {
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
      
      // Update the active photo with the new content
      setActivePhoto(updatedPost);
      setIsEditing(false);
      
      // Update the post in the parent component if needed
      if (onPostDeleted) {
        // We're using onPostDeleted as a signal to the parent component that 
        // the posts list needs to be refreshed, even though we're not deleting
        onPostDeleted();
      }
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
  
  // Format date for the modal
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // If no photos, show a message
  if (postsWithImages.length === 0) {
    return (
      <div className="py-8 text-center bg-white rounded-lg shadow">
        <p className="text-gray-500">No photos shared yet.</p>
      </div>
    );
  }
  
  return (
    <>
      {/* Photo Gallery Grid */}
      <div className="grid grid-cols-3 gap-1 md:gap-2">
        {postsWithImages.map((post) => (
          <div 
            key={post._id} 
            className="aspect-square overflow-hidden bg-gray-100 relative group"
            onClick={() => openPhotoModal(post)}
          >
            <img 
              src={post.image} 
              alt="User upload" 
              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
            />
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity flex items-center justify-center">
              <div className="text-white flex items-center space-x-3">
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {post.likes?.length || 0}
                </span>
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  {post.comments?.length || 0}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Photo Modal */}
      {activePhoto && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4" onClick={closePhotoModal}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center">
                <img 
                  src={activePhoto.author?.profilePicture || "https://via.placeholder.com/40"} 
                  alt={activePhoto.author?.username || "User"} 
                  className="h-10 w-10 rounded-full object-cover mr-3"
                />
                <div>
                  <Link 
                    to={`/profile/${activePhoto.author?._id}`} 
                    className="font-medium text-gray-900 hover:underline"
                    onClick={closePhotoModal}
                  >
                    {activePhoto.author?.username || "Unknown User"}
                  </Link>
                  <p className="text-xs text-gray-500">{formatDate(activePhoto.createdAt)}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                {/* Add Post Menu with Edit functionality */}
                <PostMenu 
                  post={activePhoto} 
                  onPostDeleted={handlePostDeleted}
                  onEditPost={handleEditPost}
                />
                
                {/* Close button */}
                <button 
                  onClick={closePhotoModal} 
                  className="ml-2 text-gray-400 hover:text-gray-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Image */}
            <div className="flex-1 overflow-hidden flex items-center justify-center bg-gray-100">
              <img 
                src={activePhoto.image} 
                alt="Post" 
                className="max-w-full max-h-[60vh] object-contain"
              />
            </div>
            
            {/* Post Content */}
            <div className="p-4 border-t">
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
                activePhoto.content && (
                  <p className="text-gray-800 mb-3">{activePhoto.content}</p>
                )
              )}
              
              {!isEditing && (
                <>
                  <div className="flex items-center text-sm text-gray-500">
                    <span>{activePhoto.likes?.length || 0} likes</span>
                    <span className="mx-2">•</span>
                    <span>{activePhoto.comments?.length || 0} comments</span>
                  </div>
                  <Link 
                    to={`/post/${activePhoto._id}`} 
                    className="inline-block mt-3 text-indigo-600 hover:underline"
                    onClick={closePhotoModal}
                  >
                    View Post
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}