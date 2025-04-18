import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import ReportModal from "./ReportModal"; 

export default function PostMenu({ post, onPostDeleted, onEditPost }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false); 
  const menuRef = useRef(null);
  const { token, user } = useAuth();
  const navigate = useNavigate();
  
  const isAuthor = user && post.author && 
    (post.author._id === user._id || post.author === user._id);
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5050/posts/${post._id}`, {
        method: "DELETE",
        headers: {
          "x-auth-token": token
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Close the menu
      setIsMenuOpen(false);
      
      if (onPostDeleted) {
        onPostDeleted(post._id);
      }
      
      if (window.location.pathname === `/post/${post._id}`) {
        navigate("/");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post. Please try again.");
    }
  };

  const handleEditPost = () => {
    // Close the menu
    setIsMenuOpen(false);
    
    if (onEditPost) {
      onEditPost(post);
    }
  };
  

  const handleReportPost = () => {
    setIsMenuOpen(false);
    setIsReportModalOpen(true);
  };
  
  return (
    <div className="relative" ref={menuRef}>
      {/* Ellipsis button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="p-1.5 text-gray-500 hover:text-orange-900 rounded-full hover:bg-amber-50 focus:outline-none transition"
        aria-label="Post options"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      
      {/* Dropdown menu */}
      {isMenuOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg z-10 border border-amber-100 overflow-hidden">
          <div className="py-1">
            {isAuthor ? (
              // Options for post author
              <>
                <button
                  onClick={handleEditPost}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-orange-900 transition flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit post
                </button>
                <button
                  onClick={handleDeletePost}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete post
                </button>
              </>
            ) : (
              // Report option for non-authors
              <button
                onClick={handleReportPost}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-orange-900 transition flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Report post
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Report Modal */}
      <ReportModal 
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        postId={post._id}
        postAuthor={post.author}
      />
    </div>
  );
}