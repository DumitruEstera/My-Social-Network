import express from "express";
import cors from "cors";
import auth from "./routes/auth.js";
import posts from "./routes/posts.js";
import users from "./routes/users.js";
import admin from "./routes/admin.js"; 
import notifications from "./routes/notifications.js";
import reports from "./routes/reports.js"; 
import { auth as authMiddleware } from "./middleware/auth.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: "./config.env" });

const PORT = process.env.PORT || 5050;
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", auth);

// Protected routes - require authentication
app.use("/posts", authMiddleware, posts);
app.use("/users", authMiddleware, users);
app.use("/notifications", authMiddleware, notifications);
app.use("/reports", authMiddleware, reports); 
app.use("/admin", admin);

// start the Express server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});