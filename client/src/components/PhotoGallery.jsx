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
      <div className="py-8 text-center bg-white rounded-lg shadow border border-amber-50">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-yellow-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-gray-600">No photos shared yet.</p>
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
            className="aspect-square overflow-hidden bg-gray-100 relative group border border-amber-50 rounded-md"
            onClick={() => openPhotoModal(post)}
          >
            <img 
              src={post.image} 
              alt="User upload" 
              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
            />
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-50 transition-opacity flex items-center justify-center">
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
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-amber-100" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-amber-50">
              <div className="flex items-center">
                <img 
                  src={activePhoto.author?.profilePicture || "/default-avatar.jpg"} 
                  alt={activePhoto.author?.username || "User"} 
                  className="h-10 w-10 rounded-full object-cover mr-3 border-2 border-amber-100"
                />
                <div>
                  <Link 
                    to={`/profile/${activePhoto.author?._id}`} 
                    className="font-medium text-gray-900 hover:text-orange-900 transition"
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
                  className="ml-2 text-gray-400 hover:text-orange-900 transition"
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
            <div className="p-4 border-t border-amber-50">
              {isEditing ? (
                <div className="mb-3">
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
                activePhoto.content && (
                  <p className="text-gray-800 mb-3 leading-relaxed">{activePhoto.content}</p>
                )
              )}
              
              {!isEditing && (
                <>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-orange-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {activePhoto.likes?.length || 0} likes
                    </span>
                    <span className="mx-2">•</span>
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-orange-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      {activePhoto.comments?.length || 0} comments
                    </span>
                  </div>
                  <Link 
                    to={`/post/${activePhoto._id}`} 
                    className="inline-block mt-3 text-orange-900 hover:text-yellow-600 font-medium transition"
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