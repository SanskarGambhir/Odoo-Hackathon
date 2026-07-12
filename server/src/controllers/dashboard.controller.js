import prisma from "../db/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getKpis = asyncHandler(async (req, res) => {
  const { type, region } = req.query;

  const vehicleFilter = {
    ...(type && { type }),
    ...(region && { region }),
  };

  const [
    activeVehicles,
    availableVehicles,
    vehiclesInMaintenance,
    onTripVehicles,
    activeTrips,
    pendingTrips,
    driversOnDuty,
  ] = await Promise.all([
    prisma.vehicle.count({
      where: { ...vehicleFilter, status: { not: "RETIRED" } },
    }),
    prisma.vehicle.count({
      where: { ...vehicleFilter, status: "AVAILABLE" },
    }),
    prisma.vehicle.count({
      where: { ...vehicleFilter, status: "IN_SHOP" },
    }),
    prisma.vehicle.count({
      where: { ...vehicleFilter, status: "ON_TRIP" },
    }),
    prisma.trip.count({ where: { status: "DISPATCHED" } }),
    prisma.trip.count({ where: { status: "DRAFT" } }),
    prisma.driver.count({ where: { status: "ON_TRIP" } }),
  ]);

  const fleetUtilization =
    activeVehicles > 0 ? (onTripVehicles / activeVehicles) * 100 : 0;

  return res.status(200).json({
    success: true,
    data: {
      activeVehicles,
      availableVehicles,
      vehiclesInMaintenance,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilization: Number(fleetUtilization.toFixed(2)),
    },
  });
});
