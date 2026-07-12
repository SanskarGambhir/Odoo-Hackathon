// src/routes/notification.routes.js
import { Router } from "express";
import { triggerExpiryCheck } from "../controllers/notification.controller.js";

// ⚠ ADJUST THESE TWO LINES to match your actual middleware file/exports.
// I don't have the contents of your auth.middleware.js, so this is a
// placeholder following the common pattern (verifyJWT + role check).
// Check server/src/middlewares/ for the real export names and swap in.
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

// Only Fleet Manager / Safety Officer should be able to trigger this manually.
// Adjust the role list to match your Role enum values as needed.
router.post(
  "/check-expiries",
  verifyJWT,
  authorizeRoles("FLEET_MANAGER", "SAFETY_OFFICER"),
  triggerExpiryCheck
);

export default router;