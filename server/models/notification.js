import { ObjectId } from "mongodb";

// Notification schema for MongoDB
export const NotificationSchema = {
  recipient: ObjectId,  // Who receives the notification
  sender: ObjectId,     // Who triggered the notification
  type: String,         // Type of notification (follow, like, comment)
  read: Boolean,        // Whether the notification has been read
  content: String,      // Notification message
  reference: ObjectId,  // Reference to post/comment if applicable
  createdAt: Date
};

// Helper functions for notification operations
export const createNotification = async (db, notificationData) => {
  const collection = await db.collection("notifications");
  const newNotification = {
    ...notificationData,
    read: false,
    createdAt: new Date()
  };
  return await collection.insertOne(newNotification);
};

export const getUserNotifications = async (db, userId, limit = 20) => {
  const collection = await db.collection("notifications");
  return await collection.find({ 
    recipient: new ObjectId(userId) 
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .toArray();
};

export const getUnreadCount = async (db, userId) => {
  const collection = await db.collection("notifications");
  return await collection.countDocuments({ 
    recipient: new ObjectId(userId),
    read: false 
  });
};

export const markAsRead = async (db, notificationId, userId) => {
  const collection = await db.collection("notifications");
  return await collection.updateOne(
    { 
      _id: new ObjectId(notificationId),
      recipient: new ObjectId(userId)
    },
    { $set: { read: true } }
  );
};

export const markAllAsRead = async (db, userId) => {
  const collection = await db.collection("notifications");
  return await collection.updateMany(
    { 
      recipient: new ObjectId(userId),
      read: false 
    },
    { $set: { read: true } }
  );
};

export const deleteNotification = async (db, notificationId, userId) => {
  const collection = await db.collection("notifications");
  return await collection.deleteOne({ 
    _id: new ObjectId(notificationId),
    recipient: new ObjectId(userId)
  });
};