// src/utils/MentionUtils.js

/**
 * Formats a comment text to highlight and make @mentions clickable
 * @param {string} text - The comment text
 * @param {Function} handleProfileClick - Function to handle profile clicks with username param
 * @returns {JSX.Element|string} - Formatted text with clickable @mentions
 */
export const formatCommentWithMentions = (text, handleProfileClick) => {
    if (!text) return "";
    
    // Regular expression to find @username mentions
    // This regex matches @ followed by letters, numbers, or underscores
    const mentionRegex = /(@\w+)/g;
    
    // Split the text by mentions
    const parts = text.split(mentionRegex);
    
    if (parts.length <= 1) {
      return text; // No mentions found, return plain text
    }
    
    // Create an array to hold rendered content
    const renderedContent = [];
    
    // Process each part
    for (let i = 0; i < parts.length; i++) {
      if (parts[i]) {
        if (parts[i].startsWith('@')) {
          // This is a mention
          const username = parts[i].substring(1); // Remove the @ symbol
          renderedContent.push(
            <span 
              key={i} 
              onClick={() => handleProfileClick(username)}
              className="text-blue-600 hover:underline font-medium cursor-pointer"
            >
              {parts[i]}
            </span>
          );
        } else {
          // This is regular text
          renderedContent.push(parts[i]);
        }
      }
    }
    
    return <>{renderedContent}</>;
  };
  
  /**
   * Find a user by username and navigate to their profile
   * @param {string} username - Username to search for
   * @param {string} token - Auth token
   * @param {Function} navigate - React Router navigate function
   */
  export const findUserByUsernameAndNavigate = async (username, token, navigate) => {
    try {
      // Try finding the exact username match using our new endpoint
      const response = await fetch(`http://localhost:5050/users/username/${username}`, {
        headers: {
          "x-auth-token": token
        }
      });
      
      if (response.ok) {
        // User was found, navigate to their profile
        const user = await response.json();
        navigate(`/profile/${user._id}`);
        return;
      }
      
      // If the exact match endpoint failed, try the search endpoint
      const searchResponse = await fetch(`http://localhost:5050/users/search/${username}`, {
        headers: {
          "x-auth-token": token
        }
      });
      
      if (searchResponse.ok) {
        const users = await searchResponse.json();
        
        // Try to find an exact match in the search results
        const exactMatch = users.find(user => 
          user.username.toLowerCase() === username.toLowerCase()
        );
        
        if (exactMatch) {
          // Navigate to the user's profile
          navigate(`/profile/${exactMatch._id}`);
          return;
        }
      }
      
      // If we got here, no exact match was found
      // Redirect to search results instead
      navigate(`/search?q=${encodeURIComponent(username)}`);
      
    } catch (error) {
      console.error("Error finding user by username:", error);
      // If there's an error, navigate to search with the username
      navigate(`/search?q=${encodeURIComponent(username)}`);
    }
  };