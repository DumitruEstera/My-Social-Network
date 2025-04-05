// server/routes/users.js
import express from "express";
import { ObjectId } from "mongodb";
import db from "../db/connection.js";
import { findUserById } from "../models/user.js";
import upload from "../middleware/upload.js";
import { uploadImage } from "../utils/cloudinary.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Get user profile by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await findUserById(db, req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Upload profile picture
router.post("/profilePicture", upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const imagePath = req.file.path;
    
    // Upload to Cloudinary
    const imageResult = await uploadImage(imagePath);
    
    // Update user's profile picture
    const collection = await db.collection("users");
    await collection.updateOne(
      { _id: new ObjectId(req.user.id) },
      { $set: { profilePicture: imageResult.url } }
    );
    
    // Delete temp file
    fs.unlinkSync(imagePath);
    
    // Get updated user
    const updatedUser = await findUserById(db, req.user.id);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.json({ 
      user: userWithoutPassword,
      profilePicture: imageResult.url
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Update user profile
router.patch("/:id", async (req, res) => {
  try {
    // Check if user exists
    const user = await findUserById(db, req.params.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    // Check if authorized (only update own profile)
    if (req.user.id !== req.params.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }
    
    const { bio, profilePicture } = req.body;
    const updateFields = {};
    
    if (bio !== undefined) updateFields.bio = bio;
    if (profilePicture !== undefined) updateFields.profilePicture = profilePicture;
    
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ msg: "No fields to update" });
    }
    
    // Update user
    const collection = await db.collection("users");
    await collection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateFields }
    );
    
    // Get updated user
    const updatedUser = await findUserById(db, req.params.id);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.json(userWithoutPassword);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Follow/unfollow a user
router.post("/:id/follow", async (req, res) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({ msg: "Cannot follow yourself" });
    }
    
    const userToFollow = await findUserById(db, req.params.id);
    const currentUser = await findUserById(db, req.user.id);
    
    if (!userToFollow || !currentUser) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    const collection = await db.collection("users");
    
    // Check if already following
    const isFollowing = currentUser.following && 
                        currentUser.following.some(id => id.toString() === req.params.id);
    
    if (isFollowing) {
      // Unfollow
      await collection.updateOne(
        { _id: new ObjectId(req.user.id) },
        { $pull: { following: new ObjectId(req.params.id) } }
      );
      
      await collection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $pull: { followers: new ObjectId(req.user.id) } }
      );
    } else {
      // Follow
      await collection.updateOne(
        { _id: new ObjectId(req.user.id) },
        { $addToSet: { following: new ObjectId(req.params.id) } }
      );
      
      await collection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $addToSet: { followers: new ObjectId(req.user.id) } }
      );
      
      // Create a notification for the user being followed
      const notificationCollection = await db.collection("notifications");
      await notificationCollection.insertOne({
        recipient: new ObjectId(req.params.id),
        sender: new ObjectId(req.user.id),
        type: "follow",
        read: false,
        content: `${currentUser.username} started following you.`,
        createdAt: new Date()
      });
    }
    
    // Get updated user to follow
    const updatedUserToFollow = await findUserById(db, req.params.id);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUserToFollow;
    
    res.json(userWithoutPassword);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Search users
router.get("/search/:query", async (req, res) => {
  try {
    const collection = await db.collection("users");
    const users = await collection.find({
      $or: [
        { username: { $regex: req.params.query, $options: "i" } },
        { email: { $regex: req.params.query, $options: "i" } }
      ]
    }).toArray();
    
    // Remove passwords from response
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.json(usersWithoutPasswords);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;