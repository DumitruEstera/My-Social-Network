import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { token } = useAuth();

  useEffect(() => {
    const searchUsers = async () => {
      if (!query || query.trim().length === 0) {
        setUsers([]);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(`http://localhost:5050/users/search/${query}`, {
          headers: {
            "x-auth-token": token
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setUsers(data);
      } catch (err) {
        console.error("Error searching users:", err);
        setError("An error occurred while searching for users");
      } finally {
        setLoading(false);
      }
    };

    searchUsers();
  }, [query, token]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-orange-900 mb-2">Search Results</h1>
        <p className="text-yellow-600 italic">
          {query ? `Showing results for "${query}"` : "Enter a search term to find users"}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-900"></div>
            <p className="mt-4 text-orange-900">Searching for users...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-6 rounded-xl shadow-md mb-6 text-red-700 border border-red-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-center font-medium">{error}</p>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-md text-center border border-amber-50">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-yellow-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-gray-600 mb-2">
            {query ? "No users found matching your search." : "Enter a username to search for users."}
          </p>
          {query && (
            <p className="text-orange-900 font-medium">Try a different search term.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user._id} className="bg-white p-5 rounded-xl shadow-md flex items-center border border-amber-50 transition duration-300 hover:shadow-lg">
              <img
                src={user.profilePicture || "/default-avatar.jpg"}
                alt={user.username}
                className="h-16 w-16 rounded-full object-cover mr-4 border-2 border-amber-100 shadow-sm"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-lg">{user.username}</h3>
                <p className="text-gray-600 text-sm">{user.bio || "No bio available"}</p>
                <div className="mt-2 text-sm text-gray-500">
                  {user.followers?.length || 0} followers · {user.following?.length || 0} following
                </div>
              </div>
              <Link
                to={`/profile/${user._id}`}
                className="px-4 py-2 bg-orange-900 text-white rounded-lg hover:bg-yellow-600 transition shadow-sm"
              >
                View Profile
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}