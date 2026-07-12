import prisma from "../db/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createMaintenanceLog = asyncHandler(async (req, res) => {
  const { vehicleId, description, cost } = req.body;

  if (!vehicleId || !description) {
    return res.status(400).json({
      success: false,
      message: "vehicleId and description are required",
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
  if (vehicle.status === "ON_TRIP") {
    return res.status(400).json({
      success: false,
      message: "Cannot open a maintenance log for a vehicle that is on a trip",
    });
  }
  if (vehicle.status === "RETIRED") {
    return res.status(400).json({
      success: false,
      message: "Cannot open a maintenance log for a retired vehicle",
    });
  }

  const [log] = await prisma.$transaction([
    prisma.maintenanceLog.create({
      data: {
        vehicleId,
        description,
        ...(cost != null && { cost }),
      },
    }),
    prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status: "IN_SHOP" },
    }),
  ]);

  return res.status(201).json({ success: true, data: log });
});

export const getMaintenanceLogs = asyncHandler(async (req, res) => {
  const { vehicleId, status } = req.query;

  const logs = await prisma.maintenanceLog.findMany({
    where: {
      ...(vehicleId && { vehicleId }),
      ...(status && { status }),
    },
    orderBy: { createdAt: "desc" },
  });

  return res.status(200).json({ success: true, data: logs });
});

export const getMaintenanceLogById = asyncHandler(async (req, res) => {
  const log = await prisma.maintenanceLog.findUnique({
    where: { id: req.params.id },
  });

  if (!log) {
    return res
      .status(404)
      .json({ success: false, message: "Maintenance log not found" });
  }

  return res.status(200).json({ success: true, data: log });
});

export const closeMaintenanceLog = asyncHandler(async (req, res) => {
  const log = await prisma.maintenanceLog.findUnique({
    where: { id: req.params.id },
    include: { vehicle: true },
  });

  if (!log) {
    return res
      .status(404)
      .json({ success: false, message: "Maintenance log not found" });
  }
  if (log.status !== "OPEN") {
    return res
      .status(400)
      .json({ success: false, message: "Maintenance log is already closed" });
  }

  const [updatedLog] = await prisma.$transaction([
    prisma.maintenanceLog.update({
      where: { id: log.id },
      data: { status: "CLOSED", closedAt: new Date() },
    }),
    ...(log.vehicle.status !== "RETIRED"
      ? [
          prisma.vehicle.update({
            where: { id: log.vehicleId },
            data: { status: "AVAILABLE" },
          }),
        ]
      : []),
  ]);

  return res.status(200).json({ success: true, data: updatedLog });
});
