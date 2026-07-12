import prisma from "../db/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";

const toNumber = (value) => (value == null ? 0 : Number(value));

async function buildFuelEfficiencyReport() {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      trips: { where: { status: "COMPLETED" } },
      fuelLogs: true,
    },
  });

  return vehicles.map((vehicle) => {
    const totalDistance = vehicle.trips.reduce(
      (sum, trip) =>
        sum + (toNumber(trip.endOdometer) - toNumber(trip.startOdometer)),
      0
    );
    const totalFuelLiters = vehicle.fuelLogs.reduce(
      (sum, log) => sum + toNumber(log.liters),
      0
    );

    return {
      vehicleId: vehicle.id,
      registrationNo: vehicle.registrationNo,
      name: vehicle.name,
      totalDistance,
      totalFuelLiters,
      fuelEfficiencyKmPerL:
        totalFuelLiters > 0
          ? Number((totalDistance / totalFuelLiters).toFixed(2))
          : null,
    };
  });
}

async function buildFleetUtilizationReport() {
  const vehicles = await prisma.vehicle.findMany();
  const activeVehicles = vehicles.filter((v) => v.status !== "RETIRED");
  const onTripVehicles = activeVehicles.filter((v) => v.status === "ON_TRIP");

  return [
    {
      totalActiveVehicles: activeVehicles.length,
      vehiclesOnTrip: onTripVehicles.length,
      fleetUtilizationPercent:
        activeVehicles.length > 0
          ? Number(
              ((onTripVehicles.length / activeVehicles.length) * 100).toFixed(2)
            )
          : 0,
    },
  ];
}

async function buildOperationalCostReport() {
  const vehicles = await prisma.vehicle.findMany({
    include: { fuelLogs: true, maintenanceLogs: true },
  });

  return vehicles.map((vehicle) => {
    const fuelCost = vehicle.fuelLogs.reduce(
      (sum, log) => sum + toNumber(log.cost),
      0
    );
    const maintenanceCost = vehicle.maintenanceLogs.reduce(
      (sum, log) => sum + toNumber(log.cost),
      0
    );

    return {
      vehicleId: vehicle.id,
      registrationNo: vehicle.registrationNo,
      name: vehicle.name,
      fuelCost: Number(fuelCost.toFixed(2)),
      maintenanceCost: Number(maintenanceCost.toFixed(2)),
      totalOperationalCost: Number((fuelCost + maintenanceCost).toFixed(2)),
    };
  });
}

async function buildVehicleRoiReport() {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      trips: { where: { status: "COMPLETED" } },
      fuelLogs: true,
      maintenanceLogs: true,
    },
  });

  return vehicles.map((vehicle) => {
    const revenue = vehicle.trips.reduce(
      (sum, trip) => sum + toNumber(trip.revenue),
      0
    );
    const fuelCost = vehicle.fuelLogs.reduce(
      (sum, log) => sum + toNumber(log.cost),
      0
    );
    const maintenanceCost = vehicle.maintenanceLogs.reduce(
      (sum, log) => sum + toNumber(log.cost),
      0
    );
    const acquisitionCost = toNumber(vehicle.acquisitionCost);
    const roi =
      acquisitionCost > 0
        ? (revenue - (fuelCost + maintenanceCost)) / acquisitionCost
        : null;

    return {
      vehicleId: vehicle.id,
      registrationNo: vehicle.registrationNo,
      name: vehicle.name,
      revenue: Number(revenue.toFixed(2)),
      fuelCost: Number(fuelCost.toFixed(2)),
      maintenanceCost: Number(maintenanceCost.toFixed(2)),
      acquisitionCost,
      roi: roi != null ? Number(roi.toFixed(4)) : null,
    };
  });
}

const REPORT_BUILDERS = {
  "fuel-efficiency": buildFuelEfficiencyReport,
  "fleet-utilization": buildFleetUtilizationReport,
  "operational-cost": buildOperationalCostReport,
  "vehicle-roi": buildVehicleRoiReport,
};

export const getFuelEfficiencyReport = asyncHandler(async (req, res) => {
  const data = await buildFuelEfficiencyReport();
  return res.status(200).json({ success: true, data });
});

export const getFleetUtilizationReport = asyncHandler(async (req, res) => {
  const data = await buildFleetUtilizationReport();
  return res.status(200).json({ success: true, data: data[0] });
});

export const getOperationalCostReport = asyncHandler(async (req, res) => {
  const data = await buildOperationalCostReport();
  return res.status(200).json({ success: true, data });
});

export const getVehicleRoiReport = asyncHandler(async (req, res) => {
  const data = await buildVehicleRoiReport();
  return res.status(200).json({ success: true, data });
});

const toCsv = (rows) => {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => JSON.stringify(row[h] ?? "")).join(","));
  }
  return lines.join("\n");
};

export const exportReportCsv = asyncHandler(async (req, res) => {
  const { report } = req.query;
  const builder = REPORT_BUILDERS[report];

  if (!builder) {
    return res.status(400).json({
      success: false,
      message: `Unknown report "${report}". Valid options: ${Object.keys(
        REPORT_BUILDERS
      ).join(", ")}`,
    });
  }

  const data = await builder();
  const csv = toCsv(data);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${report}.csv"`
  );
  return res.status(200).send(csv);
});
