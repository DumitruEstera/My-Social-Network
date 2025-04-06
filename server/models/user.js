import { ObjectId } from "mongodb";

// User schema for MongoDB (conceptual)
// Fields: username, email, password (hashed), created_at
// Update UserSchema to include social network fields
export const UserSchema = {
  username: String,
  email: String,
  password: String,
  created_at: Date,
  profilePicture: String,
  bio: String,
  followers: Array,
  following: Array
};

// Helper functions for user operations
export const createUser = async (db, userData) => {
  const collection = await db.collection("users");
  const newUser = {
    ...userData,
    created_at: new Date()
  };
  return await collection.insertOne(newUser);
};

export const findUserByEmail = async (db, email) => {
  const collection = await db.collection("users");
  return await collection.findOne({ email });
};

export const findUserById = async (db, id) => {
  const collection = await db.collection("users");
  return await collection.findOne({ _id: new ObjectId(id) });
};

// New function to find a user by username (case-insensitive exact match)
export const findUserByUsername = async (db, username) => {
  const collection = await db.collection("users");
  return await collection.findOne({ 
    username: { $regex: `^${username}$`, $options: "i" } 
  });
};