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
      <h1 className="text-2xl font-bold mb-6">Search Results for: {query}</h1>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md text-red-700">{error}</div>
      ) : users.length === 0 ? (
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <p className="text-gray-500">
            {query ? "No users found matching your search." : "Enter a username to search for users."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user._id} className="bg-white p-4 rounded-lg shadow flex items-center">
              <img
                src={user.profilePicture || "https://via.placeholder.com/50"}
                alt={user.username}
                className="h-12 w-12 rounded-full object-cover mr-4"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{user.username}</h3>
                <p className="text-gray-500 text-sm">{user.bio || "No bio available"}</p>
              </div>
              <Link
                to={`/profile/${user._id}`}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
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