import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminPanel() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <img
            src={user?.profilePicture || "/default-avatar.jpg"}
            alt={user?.username}
            className="h-16 w-16 rounded-full object-cover"
          />
          <div>
            <h2 className="text-xl font-semibold">{user?.username}</h2>
            <p className="text-gray-500">Administrator</p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-600">
            This is a placeholder for the admin panel. <br />
            Additional functionality will be implemented later.
          </p>
        </div>
      </div>
    </div>
  );
}