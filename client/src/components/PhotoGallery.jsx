import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function PhotoGallery({ posts }) {
  const [activePhoto, setActivePhoto] = useState(null);
  
  // Filter posts to include only those with images
  const postsWithImages = posts.filter(post => post.image);
  
  // Open modal with larger image
  const openPhotoModal = (post) => {
    setActivePhoto(post);
  };
  
  // Close the modal
  const closePhotoModal = () => {
    setActivePhoto(null);
  };
  
  // If no photos, show a message
  if (postsWithImages.length === 0) {
    return (
      <div className="py-8 text-center bg-white rounded-lg shadow">
        <p className="text-gray-500">No photos shared yet.</p>
      </div>
    );
  }
  
  // Format date for the modal
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const navigate = useNavigate();
  
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
              <button onClick={closePhotoModal} className="text-gray-400 hover:text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
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
              {activePhoto.content && (
                <p className="text-gray-800 mb-3">{activePhoto.content}</p>
              )}
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
            </div>
          </div>
        </div>
      )}
    </>
  );
}