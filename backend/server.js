import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongdb.js";

import userRouter from "./routes/userRoutes.js";
import imageRouter from "./routes/imageRoutes.js";


const app = express();

// ✅ Middleware
app.use(express.json());

app.use(cors({
  origin: [
    "http://localhost:5173", // local
    "https://your-frontend-url.vercel.app" // 🔁 replace after deploy
  ],
  credentials: true
}));

// ✅ Routes
app.use('/api/user', userRouter);
app.use('/api/image', imageRouter);

app.get("/", (req, res) => {
  res.send("API working 🚀");
});

// ✅ Start server AFTER DB connects
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ DB connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("❌ DB connection failed:", error.message);
    process.exit(1);
  }
};

startServer();