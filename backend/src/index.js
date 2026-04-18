import express from "express";
import prisma from "./config/db.js";

const app = express();

app.use(express.json());

// DB connection check function
async function checkDBConnection() {
  try {
    await prisma.$connect();

    // simple query to verify DB is alive
    await prisma.$queryRaw`SELECT 1`;

    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error(error);
    process.exit(1); // stop app if DB fails
  }
}

// routes
app.get("/", (req, res) => {
  res.send("Hello World 🚀");
});

// start server ONLY after DB connects
const PORT = process.env.PORT || 5000;

checkDBConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});