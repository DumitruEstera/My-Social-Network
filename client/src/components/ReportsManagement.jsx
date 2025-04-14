import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function ReportsManagement() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');
  const [activeReport, setActiveReport] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    fetchReports();
  }, [filter, token]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5050/reports?status=${filter}`, {
        headers: {
          'x-auth-token': token
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReports(data);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (report) => {
    setActiveReport(report);
    setAdminNotes(report.adminNotes || '');
  };

  const closeReportDetails = () => {
    setActiveReport(null);
    setAdminNotes('');
  };

  const updateReportStatus = async (reportId, newStatus) => {
    setUpdatingStatus(true);
    try {
      const response = await fetch(`http://localhost:5050/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update report status');
      }

      // Refresh reports list
      fetchReports();
      // Close the details view
      closeReportDetails();
    } catch (err) {
      console.error('Error updating report:', err);
      alert('Failed to update report status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get reason badge color
  const getReasonBadgeColor = (reason) => {
    if (reason.includes('Harassment') || reason.includes('bullying')) {
      return 'bg-red-100 text-red-800';
    } else if (reason.includes('Inappropriate')) {
      return 'bg-orange-100 text-orange-800';
    } else if (reason.includes('Spam')) {
      return 'bg-blue-100 text-blue-800';
    } else if (reason.includes('Hate')) {
      return 'bg-purple-100 text-purple-800';
    } else if (reason.includes('Violence')) {
      return 'bg-red-100 text-red-800';
    } else if (reason.includes('Misinformation')) {
      return 'bg-amber-100 text-amber-800';
    } else if (reason.includes('Illegal')) {
      return 'bg-red-100 text-red-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-amber-50">
      <h2 className="text-xl font-semibold text-orange-900 mb-4">Reports Management</h2>

      {/* Filter tabs */}
      <div className="flex border-b border-amber-100 mb-6 overflow-x-auto">
        <button
          onClick={() => setFilter('pending')}
          className={`py-3 px-6 font-medium ${
            filter === 'pending'
              ? 'text-orange-900 border-b-2 border-orange-900'
              : 'text-gray-600 hover:text-orange-900 transition'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('reviewed')}
          className={`py-3 px-6 font-medium ${
            filter === 'reviewed'
              ? 'text-orange-900 border-b-2 border-orange-900'
              : 'text-gray-600 hover:text-orange-900 transition'
          }`}
        >
          Reviewed
        </button>
        <button
          onClick={() => setFilter('resolved')}
          className={`py-3 px-6 font-medium ${
            filter === 'resolved'
              ? 'text-orange-900 border-b-2 border-orange-900'
              : 'text-gray-600 hover:text-orange-900 transition'
          }`}
        >
          Resolved
        </button>
        <button
          onClick={() => setFilter('dismissed')}
          className={`py-3 px-6 font-medium ${
            filter === 'dismissed'
              ? 'text-orange-900 border-b-2 border-orange-900'
              : 'text-gray-600 hover:text-orange-900 transition'
          }`}
        >
          Dismissed
        </button>
        <button
          onClick={() => setFilter('')}
          className={`py-3 px-6 font-medium ${
            filter === ''
              ? 'text-orange-900 border-b-2 border-orange-900'
              : 'text-gray-600 hover:text-orange-900 transition'
          }`}
        >
          All Reports
        </button>
      </div>

      {/* Reports list */}
      <div className="overflow-x-auto border border-amber-50 rounded-xl">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-100 border-t-4 border-t-orange-900"></div>
              <p className="mt-4 text-orange-900 font-medium">Loading reports...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-5 rounded-lg border border-red-200">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex justify-center items-center py-10 text-gray-500">
            No {filter ? filter : ''} reports found.
          </div>
        ) : (
          <table className="min-w-full bg-white rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-amber-50 text-gray-700 uppercase text-sm">
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Reporter</th>
                <th className="py-3 px-4 text-left">Post Author</th>
                <th className="py-3 px-4 text-left">Reason</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-50">
              {reports.map((report) => (
                <tr key={report._id} className="hover:bg-amber-50 transition">
                  <td className="py-3 px-4 text-gray-700">
                    {formatDate(report.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <img
                        src={report.reporter?.profilePicture || "/default-avatar.jpg"}
                        alt={report.reporter?.username || "User"}
                        className="h-8 w-8 rounded-full object-cover mr-2 border border-amber-100"
                      />
                      <div>
                        <p className="font-medium text-gray-800">
                          {report.reporter?.username || "Unknown User"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {report.postSnapshot?.author ? (
                      <div className="flex items-center">
                        <img
                          src={report.postSnapshot.author?.profilePicture || "/default-avatar.jpg"}
                          alt={report.postSnapshot.author?.username || "User"}
                          className="h-8 w-8 rounded-full object-cover mr-2 border border-amber-100"
                        />
                        <p className="font-medium text-gray-800">
                          {report.postSnapshot.author?.username || "Unknown User"}
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-500">Unknown</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${getReasonBadgeColor(report.reason)}`}>
                      {report.reason}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(report.status)}`}>
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleViewReport(report)}
                      className="px-3 py-1 bg-orange-900 text-white text-sm rounded-lg hover:bg-yellow-600 transition"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Report details modal */}
      {activeReport && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-amber-50 p-4 flex justify-between items-center z-10">
              <h3 className="text-lg font-semibold text-gray-900">Report Details</h3>
              <button
                onClick={closeReportDetails}
                className="text-gray-400 hover:text-orange-900 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Report Info */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(activeReport.status)}`}>
                      {activeReport.status.charAt(0).toUpperCase() + activeReport.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Reported on {formatDate(activeReport.createdAt)}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">Reporter</h4>
                    <div className="flex items-center">
                      <img
                        src={activeReport.reporter?.profilePicture || "/default-avatar.jpg"}
                        alt={activeReport.reporter?.username || "User"}
                        className="h-10 w-10 rounded-full object-cover mr-3 border-2 border-amber-100"
                      />
                      <div>
                        <Link
                          to={`/profile/${activeReport.reporter?._id}`}
                          className="font-medium text-orange-900 hover:text-yellow-600 transition"
                        >
                          {activeReport.reporter?.username || "Unknown User"}
                        </Link>
                        <p className="text-sm text-gray-500">{activeReport.reporter?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">Post Author</h4>
                    {activeReport.postSnapshot?.author ? (
                      <div className="flex items-center">
                        <img
                          src={activeReport.postSnapshot.author?.profilePicture || "/default-avatar.jpg"}
                          alt={activeReport.postSnapshot.author?.username || "User"}
                          className="h-10 w-10 rounded-full object-cover mr-3 border-2 border-amber-100"
                        />
                        <div>
                          <Link
                            to={`/profile/${activeReport.postSnapshot.author?._id}`}
                            className="font-medium text-orange-900 hover:text-yellow-600 transition"
                          >
                            {activeReport.postSnapshot.author?.username || "Unknown User"}
                          </Link>
                          <p className="text-sm text-gray-500">{activeReport.postSnapshot.author?.email}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">User information not available</p>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-2">Report Reason</h4>
                  <div className="flex items-center mb-2">
                    <span className={`px-3 py-1 rounded-full ${getReasonBadgeColor(activeReport.reason)}`}>
                      {activeReport.reason}
                    </span>
                  </div>
                  {activeReport.description && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Additional Details</h5>
                      <p className="text-gray-600">{activeReport.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Reported Post Content */}
              <div className="border border-amber-50 rounded-lg overflow-hidden mb-6">
                <div className="bg-amber-50 px-4 py-3 border-b border-amber-100">
                  <h4 className="font-medium text-gray-700">Reported Post Content</h4>
                </div>
                <div className="p-4">
                  {activeReport.postSnapshot ? (
                    <div>
                      <p className="text-gray-800 mb-4">{activeReport.postSnapshot.content}</p>
                      {activeReport.postSnapshot.image && (
                        <div className="mb-2">
                          <img
                            src={activeReport.postSnapshot.image}
                            alt="Post content"
                            className="rounded-lg max-h-64 object-contain"
                          />
                        </div>
                      )}
                      <p className="text-xs text-gray-500">
                        Posted on {formatDate(activeReport.postSnapshot.createdAt)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Post content not available</p>
                  )}
                </div>
              </div>

              {/* View original post button */}
              <div className="flex justify-center mb-6">
                <Link
                  to={`/post/${activeReport.postId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-orange-900 hover:text-yellow-600 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View Original Post
                </Link>
              </div>

              {/* Admin notes */}
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  rows="3"
                  placeholder="Add notes about this report..."
                ></textarea>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 justify-center">
                {activeReport.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateReportStatus(activeReport._id, 'reviewed')}
                      disabled={updatingStatus}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      Mark as Reviewed
                    </button>
                    <button
                      onClick={() => updateReportStatus(activeReport._id, 'resolved')}
                      disabled={updatingStatus}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                      Resolve Report
                    </button>
                    <button
                      onClick={() => updateReportStatus(activeReport._id, 'dismissed')}
                      disabled={updatingStatus}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
                    >
                      Dismiss Report
                    </button>
                  </>
                )}

                {activeReport.status === 'reviewed' && (
                  <>
                    <button
                      onClick={() => updateReportStatus(activeReport._id, 'resolved')}
                      disabled={updatingStatus}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                      Resolve Report
                    </button>
                    <button
                      onClick={() => updateReportStatus(activeReport._id, 'dismissed')}
                      disabled={updatingStatus}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
                    >
                      Dismiss Report
                    </button>
                  </>
                )}

                {(activeReport.status === 'resolved' || activeReport.status === 'dismissed') && (
                  <button
                    onClick={() => updateReportStatus(activeReport._id, 'pending')}
                    disabled={updatingStatus}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition disabled:opacity-50"
                  >
                    Reopen Report
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}