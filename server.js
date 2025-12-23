import dotenv from "dotenv";
dotenv.config(); // MUST BE FIRST

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";

// Routes
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";

// ---- BASIC SAFETY LOGS ----
console.log("MONGO_URI =", process.env.MONGO_URI);
console.log("JWT_ACCESS_SECRET =", process.env.JWT_ACCESS_SECRET);

// ---- CONNECT DB ----
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed", err.message);
    process.exit(1);
  });

// ---- APP INIT ----
const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// ---- ROUTES ----
app.get("/api/health", (req, res) => {
  res.json({ success: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

// ---- FALLBACK ----
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// ---- START SERVER ----
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});


