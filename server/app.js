import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./src/routes/auth.routes.js";
import vehicleRouter from "./src/routes/vehicle.routes.js";
import driverRouter from "./src/routes/driver.routes.js";
import tripRouter from "./src/routes/trip.routes.js";
import maintenanceRouter from "./src/routes/maintenance.routes.js";
import fuelRouter from "./src/routes/fuel.routes.js";
import expenseRouter from "./src/routes/expense.routes.js";
import dashboardRouter from "./src/routes/dashboard.routes.js";
import reportRouter from "./src/routes/report.routes.js";
import userRouter from "./src/routes/user.routes.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/vehicles", vehicleRouter);
app.use("/api/v1/drivers", driverRouter);
app.use("/api/v1/trips", tripRouter);
app.use("/api/v1/maintenance", maintenanceRouter);
app.use("/api/v1/fuel-logs", fuelRouter);
app.use("/api/v1/expenses", expenseRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/reports", reportRouter);
app.use("/api/v1/users", userRouter);

app.get("/", (req, res) => {
  res.send("Welcome to my Project");
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;