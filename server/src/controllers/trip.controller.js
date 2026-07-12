import prisma from "../db/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getAvailableVehicles = asyncHandler(async (req, res) => {
  const vehicles = await prisma.vehicle.findMany({
    where: { status: "AVAILABLE" },
    orderBy: { name: "asc" },
  });

  return res.status(200).json({ success: true, data: vehicles });
});

export const getAvailableDrivers = asyncHandler(async (req, res) => {
  const drivers = await prisma.driver.findMany({
    where: { status: "AVAILABLE", licenseExpiry: { gt: new Date() } },
    orderBy: { name: "asc" },
  });

  return res.status(200).json({ success: true, data: drivers });
});

export const createTrip = asyncHandler(async (req, res) => {
  const {
    source,
    destination,
    cargoWeightKg,
    plannedDistance,
    vehicleId,
    driverId,
  } = req.body;

  if (
    !source ||
    !destination ||
    cargoWeightKg == null ||
    plannedDistance == null ||
    !vehicleId ||
    !driverId
  ) {
    return res.status(400).json({
      success: false,
      message:
        "source, destination, cargoWeightKg, plannedDistance, vehicleId and driverId are required",
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
  if (vehicle.status !== "AVAILABLE") {
    return res.status(400).json({
      success: false,
      message: `Vehicle is not available (status: ${vehicle.status})`,
    });
  }

  const driver = await prisma.driver.findUnique({ where: { id: driverId } });
  if (!driver) {
    return res
      .status(404)
      .json({ success: false, message: "Driver not found" });
  }
  if (driver.status !== "AVAILABLE") {
    return res.status(400).json({
      success: false,
      message: `Driver is not available (status: ${driver.status})`,
    });
  }
  if (driver.licenseExpiry <= new Date()) {
    return res.status(400).json({
      success: false,
      message: "Driver's license has expired",
    });
  }

  if (cargoWeightKg > vehicle.maxLoadKg) {
    return res.status(400).json({
      success: false,
      message: `Cargo weight (${cargoWeightKg}kg) exceeds vehicle max load capacity (${vehicle.maxLoadKg}kg)`,
    });
  }

  const trip = await prisma.trip.create({
    data: {
      source,
      destination,
      cargoWeightKg,
      plannedDistance,
      vehicleId,
      driverId,
    },
  });

  return res.status(201).json({ success: true, data: trip });
});

export const getTrips = asyncHandler(async (req, res) => {
  const { status, vehicleId, driverId } = req.query;

  const trips = await prisma.trip.findMany({
    where: {
      ...(status && { status }),
      ...(vehicleId && { vehicleId }),
      ...(driverId && { driverId }),
    },
    orderBy: { createdAt: "desc" },
  });

  return res.status(200).json({ success: true, data: trips });
});

export const getTripById = asyncHandler(async (req, res) => {
  const trip = await prisma.trip.findUnique({
    where: { id: req.params.id },
    include: { vehicle: true, driver: true },
  });

  if (!trip) {
    return res.status(404).json({ success: false, message: "Trip not found" });
  }

  return res.status(200).json({ success: true, data: trip });
});

export const dispatchTrip = asyncHandler(async (req, res) => {
  const trip = await prisma.trip.findUnique({
    where: { id: req.params.id },
    include: { vehicle: true, driver: true },
  });

  if (!trip) {
    return res.status(404).json({ success: false, message: "Trip not found" });
  }
  if (trip.status !== "DRAFT") {
    return res.status(400).json({
      success: false,
      message: `Only DRAFT trips can be dispatched (current status: ${trip.status})`,
    });
  }
  if (trip.vehicle.status !== "AVAILABLE") {
    return res.status(400).json({
      success: false,
      message: `Vehicle is no longer available (status: ${trip.vehicle.status})`,
    });
  }
  if (trip.driver.status !== "AVAILABLE") {
    return res.status(400).json({
      success: false,
      message: `Driver is no longer available (status: ${trip.driver.status})`,
    });
  }

  const [updatedTrip] = await prisma.$transaction([
    prisma.trip.update({
      where: { id: trip.id },
      data: {
        status: "DISPATCHED",
        dispatchedAt: new Date(),
        startOdometer: trip.vehicle.odometer,
      },
    }),
    prisma.vehicle.update({
      where: { id: trip.vehicleId },
      data: { status: "ON_TRIP" },
    }),
    prisma.driver.update({
      where: { id: trip.driverId },
      data: { status: "ON_TRIP" },
    }),
  ]);

  return res.status(200).json({ success: true, data: updatedTrip });
});

export const completeTrip = asyncHandler(async (req, res) => {
  const { endOdometer, fuelConsumedL, revenue } = req.body;

  if (endOdometer == null) {
    return res
      .status(400)
      .json({ success: false, message: "endOdometer is required" });
  }

  const trip = await prisma.trip.findUnique({
    where: { id: req.params.id },
    include: { vehicle: true },
  });

  if (!trip) {
    return res.status(404).json({ success: false, message: "Trip not found" });
  }
  if (trip.status !== "DISPATCHED") {
    return res.status(400).json({
      success: false,
      message: `Only DISPATCHED trips can be completed (current status: ${trip.status})`,
    });
  }
  if (endOdometer < trip.vehicle.odometer) {
    return res.status(400).json({
      success: false,
      message: "endOdometer cannot be less than the vehicle's current odometer",
    });
  }

  const [updatedTrip] = await prisma.$transaction([
    prisma.trip.update({
      where: { id: trip.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        endOdometer,
        ...(fuelConsumedL != null && { fuelConsumedL }),
        ...(revenue != null && { revenue }),
      },
    }),
    prisma.vehicle.update({
      where: { id: trip.vehicleId },
      data: { status: "AVAILABLE", odometer: endOdometer },
    }),
    prisma.driver.update({
      where: { id: trip.driverId },
      data: { status: "AVAILABLE" },
    }),
  ]);

  return res.status(200).json({ success: true, data: updatedTrip });
});

export const cancelTrip = asyncHandler(async (req, res) => {
  const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });

  if (!trip) {
    return res.status(404).json({ success: false, message: "Trip not found" });
  }
  if (trip.status !== "DRAFT" && trip.status !== "DISPATCHED") {
    return res.status(400).json({
      success: false,
      message: `Only DRAFT or DISPATCHED trips can be cancelled (current status: ${trip.status})`,
    });
  }

  const wasDispatched = trip.status === "DISPATCHED";

  const [updatedTrip] = await prisma.$transaction([
    prisma.trip.update({
      where: { id: trip.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    }),
    ...(wasDispatched
      ? [
          prisma.vehicle.update({
            where: { id: trip.vehicleId },
            data: { status: "AVAILABLE" },
          }),
          prisma.driver.update({
            where: { id: trip.driverId },
            data: { status: "AVAILABLE" },
          }),
        ]
      : []),
  ]);

  return res.status(200).json({ success: true, data: updatedTrip });
});
