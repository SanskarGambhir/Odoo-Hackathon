import { Router } from "express";
import {
  createDriver,
  getDrivers,
  getDriverById,
  updateDriver,
  suspendDriver,
  deleteDriver,
} from "../controllers/driver.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(createDriver).get(getDrivers);
router
  .route("/:id")
  .get(getDriverById)
  .patch(updateDriver)
  .delete(deleteDriver);
router.route("/:id/suspend").patch(suspendDriver);

export default router;
