import { Router } from "express";
import {
  getFuelEfficiencyReport,
  getFleetUtilizationReport,
  getOperationalCostReport,
  getVehicleRoiReport,
  exportReportCsv,
  exportReportPdf,
} from "../controllers/report.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/fuel-efficiency").get(getFuelEfficiencyReport);
router.route("/fleet-utilization").get(getFleetUtilizationReport);
router.route("/operational-cost").get(getOperationalCostReport);
router.route("/vehicle-roi").get(getVehicleRoiReport);
router.route("/export.csv").get(exportReportCsv);
router.route("/export.pdf").get(exportReportPdf);

export default router;