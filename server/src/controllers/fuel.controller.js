import prisma from "../db/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createFuelLog = asyncHandler(async (req, res) => {
  const { vehicleId, tripId, liters, cost, loggedAt } = req.body;

  if (!vehicleId || liters == null || cost == null) {
    return res.status(400).json({
      success: false,
      message: "vehicleId, liters and cost are required",
    });
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
  });
  if (!vehicle) {
    return res
      .status(404)
      .json({ success: false, message: "Vehicle not found" });
  }

  const fuelLog = await prisma.fuelLog.create({
    data: {
      vehicleId,
      ...(tripId && { tripId }),
      liters,
      cost,
      ...(loggedAt && { loggedAt: new Date(loggedAt) }),
    },
  });

  return res.status(201).json({ success: true, data: fuelLog });
});

export const getFuelLogs = asyncHandler(async (req, res) => {
  const { vehicleId, tripId } = req.query;

  const fuelLogs = await prisma.fuelLog.findMany({
    where: {
      ...(vehicleId && { vehicleId }),
      ...(tripId && { tripId }),
    },
    orderBy: { loggedAt: "desc" },
  });

  return res.status(200).json({ success: true, data: fuelLogs });
});
