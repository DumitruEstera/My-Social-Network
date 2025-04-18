import express from "express";
import { ObjectId } from "mongodb";
import db from "../db/connection.js";
import { auth, adminAuth } from "../middleware/auth.js";
import { 
  createReport, 
  getReports, 
  getReportById, 
  updateReportStatus,
  getReportsByPost
} from "../models/report.js";
import { findPostById } from "../models/post.js";
import { findUserById } from "../models/user.js";

const router = express.Router();

// Submit a report 
router.post("/", auth, async (req, res) => {
  try {
    const { postId, reason, description } = req.body;
    
    if (!postId || !reason) {
      return res.status(400).json({ msg: "Post ID and reason are required" });
    }
    
    // Check if post exists
    const post = await findPostById(db, postId);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }
    
    // Create report data
    const reportData = {
      postId: new ObjectId(postId),
      reporterId: new ObjectId(req.user.id),
      reason,
      description: description || "",
      postSnapshot: {
        content: post.content,
        image: post.image,
        authorId: post.author,
        createdAt: post.createdAt
      }
    };
    
    // Create the report
    const result = await createReport(db, reportData);
    
    res.json({ 
      success: true, 
      reportId: result.insertedId,
      msg: "Report submitted successfully" 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get all reports (admin only)
router.get("/", adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    
    const reports = await getReports(db, status);
    
    // Populate reporter and post author information
    const populatedReports = await Promise.all(reports.map(async (report) => {
      // Get reporter info
      const reporter = await findUserById(db, report.reporterId);
      if (reporter) {
        const { password, ...reporterWithoutPassword } = reporter;
        report.reporter = reporterWithoutPassword;
      }
      
      // Get post author info if available
      if (report.postSnapshot && report.postSnapshot.authorId) {
        const postAuthor = await findUserById(db, report.postSnapshot.authorId);
        if (postAuthor) {
          const { password, ...authorWithoutPassword } = postAuthor;
          report.postSnapshot.author = authorWithoutPassword;
        }
      }
      
      // Get admin info if reviewed
      if (report.reviewedBy) {
        const admin = await findUserById(db, report.reviewedBy);
        if (admin) {
          const { password, ...adminWithoutPassword } = admin;
          report.reviewedByUser = adminWithoutPassword;
        }
      }
      
      return report;
    }));
    
    res.json(populatedReports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get a single report by ID (admin only)
router.get("/:id", adminAuth, async (req, res) => {
  try {
    const report = await getReportById(db, req.params.id);
    
    if (!report) {
      return res.status(404).json({ msg: "Report not found" });
    }
    
    // Get reporter info
    const reporter = await findUserById(db, report.reporterId);
    if (reporter) {
      const { password, ...reporterWithoutPassword } = reporter;
      report.reporter = reporterWithoutPassword;
    }
    
    // Get post author info if available
    if (report.postSnapshot && report.postSnapshot.authorId) {
      const postAuthor = await findUserById(db, report.postSnapshot.authorId);
      if (postAuthor) {
        const { password, ...authorWithoutPassword } = postAuthor;
        report.postSnapshot.author = authorWithoutPassword;
      }
    }
    
    // Check if post still exists
    try {
      const post = await findPostById(db, report.postId);
      report.postExists = !!post;
      if (post) {
        report.currentPost = post;
      }
    } catch (error) {
      report.postExists = false;
    }
    
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Update report status (admin only)
router.patch("/:id", adminAuth, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    
    if (!status) {
      return res.status(400).json({ msg: "Status is required" });
    }
    
    // Valid statuses
    const validStatuses = ["pending", "reviewed", "resolved", "dismissed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        msg: "Invalid status. Must be one of: pending, reviewed, resolved, dismissed" 
      });
    }
    
    // Update the report
    await updateReportStatus(db, req.params.id, status, req.user.id, adminNotes);
    
    // Get the updated report
    const updatedReport = await getReportById(db, req.params.id);
    
    res.json({ 
      success: true,
      report: updatedReport,
      msg: `Report marked as ${status}` 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get reports for a specific post (admin only)
router.get("/post/:postId", adminAuth, async (req, res) => {
  try {
    const reports = await getReportsByPost(db, req.params.postId);
    
    // Populate reporter information
    const populatedReports = await Promise.all(reports.map(async (report) => {
      const reporter = await findUserById(db, report.reporterId);
      if (reporter) {
        const { password, ...reporterWithoutPassword } = reporter;
        report.reporter = reporterWithoutPassword;
      }
      return report;
    }));
    
    res.json(populatedReports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;