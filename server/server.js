import express from "express";
import cors from "cors";
import records from "./routes/record.js";
import auth from "./routes/auth.js";
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
app.use("/record", authMiddleware, records); 

// start the Express server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});