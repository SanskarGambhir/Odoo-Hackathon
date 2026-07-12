import { Router } from "express";
import {
  getAvailableVehicles,
  getAvailableDrivers,
  createTrip,
  getTrips,
  getTripById,
  dispatchTrip,
  completeTrip,
  cancelTrip,
} from "../controllers/trip.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/available-vehicles").get(getAvailableVehicles);
router.route("/available-drivers").get(getAvailableDrivers);

router.route("/").post(createTrip).get(getTrips);
router.route("/:id").get(getTripById);
router.route("/:id/dispatch").post(dispatchTrip);
router.route("/:id/complete").post(completeTrip);
router.route("/:id/cancel").post(cancelTrip);

export default router;
