// src/services/notification.service.js
import cron from "node-cron";
import prisma from "../db/prisma.js"; // adjust path if your prisma client lives elsewhere
import { sendEmail, licenseExpiryEmail, insuranceExpiredEmail } from "./email.service.js";

const EXPIRY_WINDOW_DAYS = 30; // decide as a team what "soon" means

/**
 * Finds drivers whose license has already expired OR expires within the window,
 * and emails them. NOTE: Driver has no direct `email` field in your schema — email
 * only exists via the optional User relation (driver.user.email). Drivers with
 * no linked user account are skipped (logged, not silently dropped).
 */
export async function checkExpiringLicenses() {
  const now = new Date();
  const windowEnd = new Date();
  windowEnd.setDate(now.getDate() + EXPIRY_WINDOW_DAYS);

  const expiringDrivers = await prisma.driver.findMany({
    where: {
      // No lower bound: this also catches licenses that already expired,
      // not just ones expiring within the window ahead.
      licenseExpiry: {
        lte: windowEnd,
      },
      status: { not: "SUSPENDED" },
    },
    include: { user: true },
  });

  if (expiringDrivers.length === 0) {
    console.log("[expiry-check] No expiring licenses in window.");
    return { checked: 0, sent: 0, skipped: 0 };
  }

  let sent = 0;
  let skipped = 0;

  for (const driver of expiringDrivers) {
    console.log(driver)
    if (!driver.email) {
      console.warn(
        `[expiry-check] Skipping ${driver.name} (${driver.licenseNumber}) — no linked user/email.`
      );
      skipped++;
      continue;
    }

    const daysRemaining = Math.ceil(
      (new Date(driver.licenseExpiry) - now) / (1000 * 60 * 60 * 24)
    );
    const emailPayload = licenseExpiryEmail(driver, daysRemaining);
    const result = await sendEmail(emailPayload);
    if (result.success) sent++;
  }

  console.log(`[expiry-check] Checked ${expiringDrivers.length}, sent ${sent}, skipped ${skipped}.`);
  return { checked: expiringDrivers.length, sent, skipped };
}

/**
 * Flags vehicles whose insurance has expired (insuranceExpired: true) and emails
 * Fleet Managers/Admins about newly-expired ones. Also un-flags vehicles whose
 * insurance was renewed (expiry pushed back into the future).
 */
export async function checkVehicleInsurance() {
  const now = new Date();

  const newlyExpired = await prisma.vehicle.findMany({
    where: { insuranceExpiry: { lt: now }, insuranceExpired: false },
  });

  if (newlyExpired.length > 0) {
    await prisma.vehicle.updateMany({
      where: { id: { in: newlyExpired.map((v) => v.id) } },
      data: { insuranceExpired: true },
    });

    const recipients = await prisma.user.findMany({
      where: { role: { in: ["FLEET_MANAGER", "ADMIN"] } },
      select: { email: true },
    });

    for (const vehicle of newlyExpired) {
      for (const { email } of recipients) {
        await sendEmail(insuranceExpiredEmail(vehicle, email));
      }
    }
  }

  const renewed = await prisma.vehicle.findMany({
    where: { insuranceExpired: true, insuranceExpiry: { gte: now } },
  });

  if (renewed.length > 0) {
    await prisma.vehicle.updateMany({
      where: { id: { in: renewed.map((v) => v.id) } },
      data: { insuranceExpired: false },
    });
  }

  console.log(
    `[insurance-check] newly flagged: ${newlyExpired.length}, un-flagged (renewed): ${renewed.length}.`
  );
  return { flagged: newlyExpired.length, unflagged: renewed.length };
}

/**
 * Starts the cron schedule. Call this once from index.js after prisma connects.
 * Runs once immediately (so it's visible during demo without waiting),
 * then every 10 minutes. Switch to '0 9 * * *' for daily-only in real use.
 */
export function startExpiryCron() {
  checkExpiringLicenses();
  checkVehicleInsurance();

  cron.schedule("*/30 * * * *", () => {
    console.log("[expiry-check] Running scheduled check...");
    checkExpiringLicenses();
    checkVehicleInsurance();
  });

  console.log("✅ License/insurance expiry cron job started (every 10 min + on startup)");
}