// Utility function to handle blocked user errors
export const handleBlockedUserError = (error, logout) => {
    // Check if the error message indicates a blocked user
    if (error.includes('Your account has been blocked')) {
      // Show alert to the user
      alert('Your account has been blocked by an administrator. Please contact support for assistance.');
      
      // Log the user out
      logout();
      
      return true; // Error was handled
    }
    
    return false; // Error was not handled
  };