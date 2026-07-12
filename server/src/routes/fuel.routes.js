import { Router } from "express";
import { createFuelLog, getFuelLogs } from "../controllers/fuel.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(createFuelLog).get(getFuelLogs);

export default router;
