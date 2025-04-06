import express from "express";
import { ObjectId } from "mongodb";
import db from "../db/connection.js";
import { createPost, findPostById, findPostsByUser, getFeedPosts, likePost, addComment } from "../models/post.js";
import { findUserById } from "../models/user.js";
import upload from "../middleware/upload.js";
import { uploadImage } from "../utils/cloudinary.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get feed posts (posts from users the current user follows)
// In server/routes/posts.js
router.get("/", async (req, res) => {
  try {
    // Get current user
    const user = await findUserById(db, req.user.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    // Get posts from followed users and own posts
    const following = user.following || [];
    const userIds = [...following, req.user.id];
    
    const posts = await getFeedPosts(db, userIds);
    
    // Populate author information
    const populatedPosts = await Promise.all(posts.map(async (post) => {
      const author = await findUserById(db, post.author);
      // Remove password from author info
      if (author) {
        const { password, ...authorWithoutPassword } = author;
        post.author = authorWithoutPassword;
      }
      
      // Add this section to populate comment authors
      if (post.comments && post.comments.length > 0) {
        const populatedComments = await Promise.all(post.comments.map(async (comment) => {
          const commentAuthor = await findUserById(db, comment.author);
          if (commentAuthor) {
            const { password, ...authorWithoutPassword } = commentAuthor;
            return { ...comment, author: authorWithoutPassword };
          }
          return comment;
        }));
        
        post.comments = populatedComments;
      }
      
      return post;
    }));
    
    res.json(populatedPosts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Upload post image
// Place this route before other post routes
router.post("/upload-image", upload.single('image'), async (req, res) => {
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
    
    // Delete temp file
    fs.unlinkSync(imagePath);
    
    res.json({ 
      success: true,
      imageUrl: imageResult.url
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Create a new post
router.post("/", async (req, res) => {
  try {
    const { content, image } = req.body;
    
    if (!content && !image) {
      return res.status(400).json({ msg: "Post must have content or image" });
    }
    
    const postData = {
      content,
      image,
      author: new ObjectId(req.user.id)
    };
    
    const result = await createPost(db, postData);
    
    // Get the created post with author info
    const post = await findPostById(db, result.insertedId);
    const author = await findUserById(db, post.author);
    
    // Remove password from author info
    if (author) {
      const { password, ...authorWithoutPassword } = author;
      post.author = authorWithoutPassword;
    }
    
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get posts by user ID
// In server/routes/posts.js - for the user profile endpoint
router.get("/user/:userId", async (req, res) => {
  try {
    const posts = await findPostsByUser(db, req.params.userId);
    
    // Populate author information
    const populatedPosts = await Promise.all(posts.map(async (post) => {
      const author = await findUserById(db, post.author);
      // Remove password from author info
      if (author) {
        const { password, ...authorWithoutPassword } = author;
        post.author = authorWithoutPassword;
      }
      
      // Add this section to populate comment authors
      if (post.comments && post.comments.length > 0) {
        const populatedComments = await Promise.all(post.comments.map(async (comment) => {
          const commentAuthor = await findUserById(db, comment.author);
          if (commentAuthor) {
            const { password, ...authorWithoutPassword } = commentAuthor;
            return { ...comment, author: authorWithoutPassword };
          }
          return comment;
        }));
        
        post.comments = populatedComments;
      }
      
      return post;
    }));
    
    res.json(populatedPosts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Like/unlike a post
router.post("/:id/like", async (req, res) => {
  try {
    // Get the post before the like operation to check if it's already liked
    const postBefore = await findPostById(db, req.params.id);
    
    if (!postBefore) {
      return res.status(404).json({ msg: "Post not found" });
    }
    
    // Check if user has already liked this post
    const userObjectId = new ObjectId(req.user.id);
    const isAlreadyLiked = postBefore.likes.some(id => id.equals(userObjectId));
    
    // Perform the like/unlike operation
    const post = await likePost(db, req.params.id, req.user.id);
    
    // If this is a new like (not an unlike) and the post is not by the current user
    if (!isAlreadyLiked && !postBefore.author.equals(userObjectId)) {
      // Get the current user for their username
      const currentUser = await findUserById(db, req.user.id);
      
      // Create a notification for the post owner
      const notificationCollection = await db.collection("notifications");
      await notificationCollection.insertOne({
        recipient: postBefore.author,
        sender: userObjectId,
        type: "like",
        read: false,
        postId: new ObjectId(req.params.id),  
        content: `${currentUser.username} liked your post: "${postBefore.content?.substring(0, 30)}${postBefore.content?.length > 30 ? '...' : ''}"`,
        postId: postBefore._id,
        createdAt: new Date()
      });
    }
    
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Add comment to a post
router.post("/:id/comment", async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ msg: "Comment must have content" });
    }
    
    // Check if post exists
    const post = await findPostById(db, req.params.id);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }
    
    const commentData = {
      content,
      author: new ObjectId(req.user.id)
    };
    
    const comment = await addComment(db, req.params.id, commentData);
    
    // Get author info
    const author = await findUserById(db, req.user.id);
    
    // Remove password from author info
    if (author) {
      const { password, ...authorWithoutPassword } = author;
      comment.author = authorWithoutPassword;
    }
    
    res.json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get single post by ID
router.get("/:id", async (req, res) => {
  try {
    const post = await findPostById(db, req.params.id);
    
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }
    
    // Populate author information
    const author = await findUserById(db, post.author);
    
    // Remove password from author info
    if (author) {
      const { password, ...authorWithoutPassword } = author;
      post.author = authorWithoutPassword;
    }
    
    // Populate comment authors
    if (post.comments && post.comments.length > 0) {
      const populatedComments = await Promise.all(post.comments.map(async (comment) => {
        const commentAuthor = await findUserById(db, comment.author);
        if (commentAuthor) {
          const { password, ...authorWithoutPassword } = commentAuthor;
          return { ...comment, author: authorWithoutPassword };
        }
        return comment;
      }));
      
      post.comments = populatedComments;
    }
    
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;