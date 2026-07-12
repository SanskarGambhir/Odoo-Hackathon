import { Router } from "express";
import {
  createDriver,
  getDrivers,
  getDriverById,
  updateDriver,
  suspendDriver,
  deleteDriver,
  extractDriverLicense,
} from "../controllers/driver.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

// router.use(verifyJWT);

router.route("/").post(createDriver).get(getDrivers);
router.route("/extract-license").post(
  upload.fields([
    { name: "frontImage", maxCount: 1 },
    { name: "backImage", maxCount: 1 },
  ]),
  extractDriverLicense
);
router
  .route("/:id")
  .get(getDriverById)
  .patch(updateDriver)
  .delete(deleteDriver);
router.route("/:id/suspend").patch(suspendDriver);

export default router;
