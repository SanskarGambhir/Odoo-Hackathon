import { Router } from "express";
import {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  retireVehicle,
} from "../controllers/vehicle.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// router.use(verifyJWT);

router.route("/").post(createVehicle).get(getVehicles);
router
  .route("/:id")
  .get(getVehicleById)
  .patch(updateVehicle)
  .delete(retireVehicle);

export default router;
