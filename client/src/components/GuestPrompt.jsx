import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function GuestPrompt({ isOpen, onClose, action }) {
  const [visible, setVisible] = useState(isOpen);

  useEffect(() => {
    setVisible(isOpen);
  }, [isOpen]);

  // Close the modal with a slight delay for animation
  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-transform duration-300 ${
          visible ? "scale-100" : "scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <div className="h-16 w-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Create an Account to {action || "Continue"}</h3>
          <p className="mt-2 text-gray-600">
            You're currently browsing in guest mode. Sign up to interact with the community, create posts, and more!
          </p>
        </div>

        <div className="flex flex-col gap-3 mt-6">
          <Link 
            to="/register" 
            className="w-full inline-flex justify-center items-center px-4 py-2 bg-orange-900 text-white font-medium rounded-md hover:bg-yellow-600 focus:outline-none"
          >
            Create Account
          </Link>
          <Link 
            to="/login" 
            className="w-full inline-flex justify-center items-center px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300 focus:outline-none"
          >
            Sign In
          </Link>
          <button
            onClick={handleClose}
            className="mt-2 text-gray-600 hover:text-gray-800"
          >
            Continue Browsing
          </button>
        </div>
      </div>
    </div>
  );
}