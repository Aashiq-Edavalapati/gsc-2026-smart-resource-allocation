import express from "express";
import cors from "cors";
import prisma from "./config/db.js";
import usersRouter from "./routes/users.js";

const app = express();

// Enable CORS for frontend on localhost:4200
app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

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

// Routes
app.get("/", (req, res) => {
  res.send("✅ Backend API is running 🚀");
});

// Register user routes
app.use("/api/users", usersRouter);

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;

checkDBConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});