import express from "express";
import { ObjectId } from "mongodb";
import db from "../db/connection.js";
import { findUserById } from "../models/user.js";
import { 
  getUserNotifications, 
  markAsRead, 
  markAllAsRead,
  deleteNotification,
  getUnreadCount 
} from "../models/notification.js";

const router = express.Router();

// Get all notifications for the authenticated user
router.get("/", async (req, res) => {
  try {
    const notifications = await getUserNotifications(db, req.user.id);
    
    // Populate sender information
    const populatedNotifications = await Promise.all(notifications.map(async (notification) => {
      if (notification.sender) {
        const sender = await findUserById(db, notification.sender);
        if (sender) {
          const { password, ...senderWithoutPassword } = sender;
          notification.sender = senderWithoutPassword;
        }
      }
      return notification;
    }));
    
    res.json(populatedNotifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get unread notification count
router.get("/unread-count", async (req, res) => {
  try {
    const count = await getUnreadCount(db, req.user.id);
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Mark a notification as read
router.patch("/:id/read", async (req, res) => {
  try {
    await markAsRead(db, req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Mark all notifications as read
router.patch("/mark-all-read", async (req, res) => {
  try {
    await markAllAsRead(db, req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Delete a notification
router.delete("/:id", async (req, res) => {
  try {
    await deleteNotification(db, req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;