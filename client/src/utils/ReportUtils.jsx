
export const REPORT_REASONS = [
    "Inappropriate content",
    "Harassment or bullying",
    "Spam",
    "Misinformation",
    "Hate speech",
    "Violence",
    "Illegal content",
    "Other"
  ];
  
  export const REPORT_STATUS = {
    PENDING: "pending",
    REVIEWED: "reviewed",
    RESOLVED: "resolved",
    DISMISSED: "dismissed"
  };
  
  export const getReportStatusDescription = (status) => {
    switch (status) {
      case REPORT_STATUS.PENDING:
        return "This report is waiting for review by a moderator.";
      case REPORT_STATUS.REVIEWED:
        return "This report has been reviewed but no final decision has been made.";
      case REPORT_STATUS.RESOLVED:
        return "This report has been resolved. Appropriate action has been taken.";
      case REPORT_STATUS.DISMISSED:
        return "This report has been dismissed and no further action will be taken.";
      default:
        return "Unknown status";
    }
  };
  

  export const getStatusBadgeClass = (status) => {
    switch (status) {
      case REPORT_STATUS.PENDING:
        return "bg-yellow-100 text-yellow-800";
      case REPORT_STATUS.REVIEWED:
        return "bg-blue-100 text-blue-800";
      case REPORT_STATUS.RESOLVED:
        return "bg-green-100 text-green-800";
      case REPORT_STATUS.DISMISSED:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  

  export const getReasonBadgeClass = (reason) => {
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