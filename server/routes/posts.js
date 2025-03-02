import express from "express";
import { ObjectId } from "mongodb";
import db from "../db/connection.js";
import { createPost, findPostById, findPostsByUser, getFeedPosts, likePost, addComment } from "../models/post.js";
import { findUserById } from "../models/user.js";

const router = express.Router();

// Get feed posts (posts from users the current user follows)
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
        return { ...post, author: authorWithoutPassword };
      }
      return post;
    }));
    
    res.json(populatedPosts);
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
router.get("/user/:userId", async (req, res) => {
  try {
    const posts = await findPostsByUser(db, req.params.userId);
    
    // Populate author information
    const populatedPosts = await Promise.all(posts.map(async (post) => {
      const author = await findUserById(db, post.author);
      // Remove password from author info
      if (author) {
        const { password, ...authorWithoutPassword } = author;
        return { ...post, author: authorWithoutPassword };
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
    const post = await likePost(db, req.params.id, req.user.id);
    
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
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