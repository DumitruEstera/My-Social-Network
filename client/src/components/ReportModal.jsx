import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function ReportModal({ isOpen, onClose, postId, postAuthor }) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { token } = useAuth();

  // Predefined report reasons
  const reportReasons = [
    "Inappropriate content",
    "Harassment or bullying",
    "Spam",
    "Misinformation",
    "Hate speech",
    "Violence",
    "Illegal content",
    "Other"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason) {
      setError("Please select a reason for your report");
      return;
    }
    
    setError("");
    setSubmitting(true);
    
    try {
      const response = await fetch('http://localhost:5050/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ 
          postId,
          reason,
          description 
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Error submitting report');
      }
      
      setSuccess(true);
      // Reset form after 3 seconds and close modal
      setTimeout(() => {
        setReason("");
        setDescription("");
        setSuccess(false);
        onClose();
      }, 3000);
    } catch (error) {
      setError(error.message || "Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl max-w-md w-full border border-amber-100 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {success ? (
          <div className="p-6 text-center">
            <div className="h-16 w-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Report Submitted</h3>
            <p className="text-gray-600">
              Thank you for helping keep our community safe. Our moderators will review this report.
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center border-b border-amber-50 p-5">
              <h3 className="text-xl font-semibold text-gray-900">Report Post</h3>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-orange-900 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  We take reports seriously. Your report will be kept confidential and reviewed by our moderators.
                </p>
                
                {postAuthor && (
                  <div className="bg-amber-50 rounded-lg p-3 text-sm text-gray-700 mb-4 border border-amber-100">
                    You're reporting a post by <span className="font-semibold">{postAuthor.username}</span>
                  </div>
                )}
                
                {error && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm border border-red-200">
                    {error}
                  </div>
                )}
                
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Why are you reporting this post? <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  >
                    <option value="">Select a reason</option>
                    {reportReasons.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Additional details (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                    rows="3"
                    placeholder="Please provide any additional context that will help our moderators understand the issue..."
                  ></textarea>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !reason}
                  className="px-4 py-2 bg-orange-900 text-white rounded-lg hover:bg-yellow-600 transition disabled:opacity-50 flex items-center"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : "Submit Report"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}