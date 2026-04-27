console.log("ENTRY OK");

import "dotenv/config";
import express from "express";
import cors from "cors";
import prisma from "./config/db.js";
import routes from "./routes/index.js";
import { apiLimiter } from "./middlewares/rateLimiter.js";

const app = express();

/**
 * Trust proxy (required for Cloud Run and correct IP handling)
 */
app.set("trust proxy", 1);

/**
 * CORS configuration (dynamic and environment-safe)
 */
const allowedOrigins = [
  "*",
  "http://localhost:4200",
  process.env.CLIENT_URL
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);

/**
 * Middleware
 */
app.use(express.json());

/**
 * Health check route
 */
app.get("/", (req, res) => {
  res.send("Backend API is running");
});

/**
 * API routes with rate limiting
 */
app.use("/api/", apiLimiter);
app.use("/api/v1", routes);

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message
  });
});

/**
 * Start the server
 */
const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on port ${PORT}`);

  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;

    if (process.env.NODE_ENV !== "production") {
      console.log("Database connected successfully");
    }
  } catch (error) {
    console.error("Database connection failed:", error);
  }
});

/**
 * Graceful shutdown (important for Cloud Run)
 */
process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Closing server...");
  await prisma.$disconnect();
  process.exit(0);
});