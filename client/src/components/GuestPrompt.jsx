import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function GuestPrompt({ isOpen, onClose, action }) {
  const [visible, setVisible] = useState(isOpen);

  useEffect(() => {
    setVisible(isOpen);
  }, [isOpen]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 transition-opacity duration-300 backdrop-blur-sm ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white rounded-xl shadow-xl max-w-md w-full p-8 border border-amber-100 transform transition-transform duration-300 ${
          visible ? "scale-100" : "scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="h-20 w-20 mx-auto mb-5 bg-amber-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-orange-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Create an Account to {action || "Continue"}</h3>
          <p className="mt-2 text-gray-600 leading-relaxed">
            You're currently browsing in guest mode. Sign up to interact with the community, create posts, and more!
          </p>
        </div>

        <div className="space-y-3 mt-6">
          <Link 
            to="/register" 
            className="w-full flex justify-center items-center px-4 py-3 bg-orange-900 text-white font-medium rounded-lg hover:bg-yellow-600 shadow-sm transition"
          >
            Create Account
          </Link>
          <Link 
            to="/login" 
            className="w-full flex justify-center items-center px-4 py-3 bg-gray-100 text-gray-800 font-medium rounded-lg hover:bg-gray-200 transition"
          >
            Sign In
          </Link>
          <button
            onClick={handleClose}
            className="w-full text-center mt-2 py-2 text-gray-600 hover:text-orange-900 font-medium transition"
          >
            Continue Browsing
          </button>
        </div>
      </div>
    </div>
  );
}