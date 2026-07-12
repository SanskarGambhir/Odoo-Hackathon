import { Router } from "express";
import {
  createMaintenanceLog,
  getMaintenanceLogs,
  getMaintenanceLogById,
  closeMaintenanceLog,
} from "../controllers/maintenance.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(createMaintenanceLog).get(getMaintenanceLogs);
router.route("/:id").get(getMaintenanceLogById);
router.route("/:id/close").patch(closeMaintenanceLog);

export default router;
