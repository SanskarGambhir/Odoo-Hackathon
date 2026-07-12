// src/controllers/notification.controller.js
import { checkExpiringLicenses } from "../services/notification.service.js";

export async function triggerExpiryCheck(req, res) {
  try {
    const result = await checkExpiringLicenses();
    res.status(200).json({
      success: true,
      message: "Expiry check completed",
      ...result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}