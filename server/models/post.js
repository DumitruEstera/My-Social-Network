import { ObjectId } from "mongodb";

// Post schema for MongoDB (conceptual)
export const PostSchema = {
  content: String,
  author: ObjectId,
  image: String,
  likes: Array,
  comments: Array,
  createdAt: Date
};

// Helper functions for post operations
export const createPost = async (db, postData) => {
  const collection = await db.collection("posts");
  const newPost = {
    ...postData,
    likes: [],
    comments: [],
    createdAt: new Date()
  };
  return await collection.insertOne(newPost);
};

export const findPostById = async (db, id) => {
  const collection = await db.collection("posts");
  return await collection.findOne({ _id: new ObjectId(id) });
};

export const findPostsByUser = async (db, userId) => {
  const collection = await db.collection("posts");
  return await collection.find({ author: new ObjectId(userId) })
    .sort({ createdAt: -1 })
    .toArray();
};

export const getFeedPosts = async (db, userIds = [], limit = 20) => {
  const collection = await db.collection("posts");
  const objectIds = userIds.map(id => new ObjectId(id));
  
  return await collection.find({ 
    author: { $in: objectIds } 
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .toArray();
};

export const likePost = async (db, postId, userId) => {
  const collection = await db.collection("posts");
  const post = await findPostById(db, postId);
  
  if (!post) return null;
  
  const userObjectId = new ObjectId(userId);
  const isLiked = post.likes.some(id => id.equals(userObjectId));
  
  if (isLiked) {
    // Unlike
    await collection.updateOne(
      { _id: new ObjectId(postId) },
      { $pull: { likes: userObjectId } }
    );
  } else {
    // Like
    await collection.updateOne(
      { _id: new ObjectId(postId) },
      { $addToSet: { likes: userObjectId } }
    );
  }
  
  return await findPostById(db, postId);
};

export const addComment = async (db, postId, commentData) => {
  const collection = await db.collection("posts");
  const comment = {
    ...commentData,
    _id: new ObjectId(),
    createdAt: new Date()
  };
  
  await collection.updateOne(
    { _id: new ObjectId(postId) },
    { $push: { comments: comment } }
  );
  
  return comment;
};