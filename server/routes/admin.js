import express from "express";
import { ObjectId } from "mongodb";
import db from "../db/connection.js";
import { adminAuth } from "../middleware/auth.js";

const router = express.Router();

// Require admin privileges for all routes in this file
router.use(adminAuth);

// Search users - with additional admin-only user details
router.get("/users/search", async (req, res) => {
  try {
    const query = req.query.q || "";
    const collection = await db.collection("users");
    
    let users = [];
    
    if (query) {
      users = await collection.find({
        $or: [
          { username: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } }
        ]
      }).toArray();
    } else {
      // If no query, return most recent users (limit to 20)
      users = await collection.find()
        .sort({ created_at: -1 })
        .limit(20)
        .toArray();
    }
    
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

// Block/unblock a user
router.patch("/users/:id/toggle-block", async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Don't allow blocking an admin
    const userToUpdate = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    
    if (!userToUpdate) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    if (userToUpdate.isAdmin) {
      return res.status(403).json({ msg: "Cannot block an admin user" });
    }
    
    // Toggle the blocked status
    const newBlockedStatus = !userToUpdate.blocked;
    
    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $set: { blocked: newBlockedStatus } }
    );
    
    res.json({ 
      userId, 
      blocked: newBlockedStatus,
      message: `User ${newBlockedStatus ? 'blocked' : 'unblocked'} successfully` 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get user stats for admin dashboard
router.get("/stats", async (req, res) => {
  try {
    const usersCollection = await db.collection("users");
    const postsCollection = await db.collection("posts");
    
    const totalUsers = await usersCollection.countDocuments();
    const blockedUsers = await usersCollection.countDocuments({ blocked: true });
    const totalPosts = await postsCollection.countDocuments();
    
    // Get users joined in the last 7 days
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const newUsers = await usersCollection.countDocuments({ 
      created_at: { $gte: lastWeek } 
    });
    
    res.json({
      totalUsers,
      blockedUsers,
      activeUsers: totalUsers - blockedUsers,
      totalPosts,
      newUsers
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// NEW ENDPOINT: Get follower statistics
router.get("/follower-stats", async (req, res) => {
  try {
    const usersCollection = await db.collection("users");
    
    // Get all users with their follower/following info
    const users = await usersCollection.find({}, { 
      projection: { 
        username: 1, 
        followers: 1, 
        following: 1, 
        profilePicture: 1, 
        email: 1, 
        blocked: 1,
        isAdmin: 1 
      } 
    }).toArray();
    
    // Calculate follower count for each user
    const usersWithCounts = users.map(user => ({
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      blocked: user.blocked || false,
      isAdmin: user.isAdmin || false,
      followerCount: (user.followers || []).length,
      followingCount: (user.following || []).length
    }));
    
    // Sort by follower count (descending) to get top users
    const topUsers = [...usersWithCounts].sort((a, b) => b.followerCount - a.followerCount);
    
    // Process follow relationships to show who follows who
    const followRelationships = [];
    
    for (const user of users) {
      // Get the users that this user follows
      const followingUsers = [];
      
      if (user.following && user.following.length > 0) {
        for (const followingId of user.following) {
          const followingIdStr = followingId.toString();
          const followedUser = users.find(u => u._id.toString() === followingIdStr);
          
          if (followedUser) {
            followingUsers.push({
              _id: followedUser._id.toString(),
              username: followedUser.username
            });
          }
        }
      }
      
      // Create the relationship entry
      followRelationships.push({
        _id: user._id.toString(),
        username: user.username,
        following: followingUsers
      });
    }
    
    res.json({
      topUsers: topUsers.slice(0, 10), // Top 10 users by followers
      allUsers: usersWithCounts, // All users with their counts
      followRelationships: followRelationships.filter(rel => rel.following.length > 0) // Only include users who follow someone
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;