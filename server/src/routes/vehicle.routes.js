import { Router } from "express";
import {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  retireVehicle,
  extractVehicleDocuments,
} from "../controllers/vehicle.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

// router.use(verifyJWT);

router.route("/").post(createVehicle).get(getVehicles);
router
  .route("/extract-documents")
  .post(upload.array("documents", 5), extractVehicleDocuments);
router
  .route("/:id")
  .get(getVehicleById)
  .patch(updateVehicle)
  .delete(retireVehicle);

export default router;
