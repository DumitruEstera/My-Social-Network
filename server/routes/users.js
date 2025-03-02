import express from "express";
import { ObjectId } from "mongodb";
import db from "../db/connection.js";
import { findUserById } from "../models/user.js";

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