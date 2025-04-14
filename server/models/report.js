import { ObjectId } from "mongodb";

// Report schema for MongoDB
export const ReportSchema = {
  postId: ObjectId,        // The reported post
  reporterId: ObjectId,    // User who reported
  reason: String,          // Reason for report (predefined categories)
  description: String,     // Optional description
  status: String,          // "pending", "reviewed", "resolved", "dismissed"
  createdAt: Date,
  reviewedAt: Date,        // When an admin reviewed it
  reviewedBy: ObjectId,    // Admin who reviewed it
  adminNotes: String,      // Notes from admin
  postSnapshot: Object     // Snapshot of post at time of report
};

// Helper functions for report operations
export const createReport = async (db, reportData) => {
  const collection = await db.collection("reports");
  const newReport = {
    ...reportData,
    status: "pending",
    createdAt: new Date()
  };
  return await collection.insertOne(newReport);
};

export const getReports = async (db, status = null, limit = 50) => {
  const collection = await db.collection("reports");
  let query = {};
  
  if (status) {
    query.status = status;
  }
  
  return await collection.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
};

export const getReportById = async (db, reportId) => {
  const collection = await db.collection("reports");
  return await collection.findOne({ _id: new ObjectId(reportId) });
};

export const updateReportStatus = async (db, reportId, status, adminId, notes = null) => {
  const collection = await db.collection("reports");
  
  const updateData = {
    status: status,
    reviewedAt: new Date(),
    reviewedBy: new ObjectId(adminId)
  };
  
  if (notes) {
    updateData.adminNotes = notes;
  }
  
  return await collection.updateOne(
    { _id: new ObjectId(reportId) },
    { $set: updateData }
  );
};

export const getReportsByPost = async (db, postId) => {
  const collection = await db.collection("reports");
  return await collection.find({ postId: new ObjectId(postId) })
    .sort({ createdAt: -1 })
    .toArray();
};  