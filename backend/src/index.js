import express from "express";
import cors from "cors";
import prisma from "./config/db.js";
import routes from "./routes/index.js";
import { apiLimiter } from "./middlewares/rateLimiter.js";

const app = express();

// Enable CORS for frontend on localhost:4200
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("✅ Backend API is running 🚀");
});

// API Endpoints
app.use('/api/', apiLimiter); // Handle rate limiting for all the requests
app.use("/api/v1", routes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// DB connection check
async function checkDBConnection() {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
}

const PORT = process.env.PORT || 5000;

// Start server
checkDBConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});