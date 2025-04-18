import { ObjectId } from "mongodb";

// User schema for MongoDB 
export const UserSchema = {
  username: String,
  email: String,
  password: String,
  created_at: Date,
  profilePicture: String,
  bio: String,
  followers: Array,
  following: Array,
  isAdmin: Boolean 
};

// Helper functions for user operations
export const createUser = async (db, userData) => {
  const collection = await db.collection("users");
  const newUser = {
    ...userData,
    created_at: new Date(),
    followers: [],
    following: [],
    isAdmin: userData.isAdmin || false 
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

export const findUserByUsername = async (db, username) => {
  const collection = await db.collection("users");
  return await collection.findOne({ 
    username: { $regex: `^${username}$`, $options: "i" } 
  });
};