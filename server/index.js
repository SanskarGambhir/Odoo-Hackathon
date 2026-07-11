import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

import app from "./app.js";
import prisma from "./src/db/prisma.js";


const port = process.env.PORT || 3000;

async function startServer() {
  try {
    await prisma.$connect();

    console.log("✅ Connected to PostgreSQL via Prisma");

    app.listen(port, () => {
      console.log(`🚀 Server is running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error("❌ Failed to connect to the database:", err);
    process.exit(1);
  }
}

startServer();