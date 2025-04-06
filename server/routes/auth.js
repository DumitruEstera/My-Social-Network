import express from "express";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { auth, generateToken } from "../middleware/auth.js";
import db from "../db/connection.js";
import { createUser, findUserByEmail, findUserById } from "../models/user.js";

const router = express.Router();

// @route   POST /auth/register
// @desc    Register a user
// @access  Public
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    let user = await findUserByEmail(db, email);
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // Create new user
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user data
    const userData = {
      username,
      email,
      password: hashedPassword
    };

    // Save user to database
    const result = await createUser(db, userData);
    
    // Get the created user
    user = await findUserById(db, result.insertedId);

    // Create and return JWT token
    const token = generateToken(user);

    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST /auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    let user = await findUserByEmail(db, email);
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Return JWT token
    const token = generateToken(user);
    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET /auth/user
// @desc    Get authenticated user
// @access  Private
router.get("/user", auth, async (req, res) => {
  try {
    const user = await findUserById(db, req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST /auth/change-password
// @desc    Change user password
// @access  Private
router.post("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ msg: "All fields are required" });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ msg: "New password must be at least 6 characters" });
    }
    
    // Get user from database
    const user = await findUserById(db, req.user.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Current password is incorrect" });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update user password
    const collection = db.collection("users");
    await collection.updateOne(
      { _id: new ObjectId(req.user.id) },
      { $set: { password: hashedPassword } }
    );
    
    res.json({ msg: "Password updated successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

export default router;