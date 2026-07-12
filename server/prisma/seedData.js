// Populates the DB with dummy vehicles, drivers, trips and fuel logs for testing/demo purposes.
// Vehicles and drivers are upserted on their unique fields (safe to re-run).
// Trips are always inserted fresh (no natural unique key) — re-running will duplicate them.
// Fuel logs are only inserted if the table is currently empty.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const VEHICLES = [
  { registrationNo: "MH-12-AB-1234", name: "Tata Prima 4928", type: "Truck", maxLoadKg: 28000, odometer: 145230, acquisitionCost: 2500000, region: "West", status: "AVAILABLE" },
  { registrationNo: "DL-01-CD-5678", name: "Ashok Leyland 12M", type: "Bus", maxLoadKg: 16000, odometer: 230450, acquisitionCost: 4200000, region: "North", status: "ON_TRIP" },
  { registrationNo: "KA-05-EF-9012", name: "Mahindra Supro", type: "Van", maxLoadKg: 1000, odometer: 78450, acquisitionCost: 750000, region: "South", status: "AVAILABLE" },
  { registrationNo: "TN-09-GH-3456", name: "Eicher Pro 3019", type: "Truck", maxLoadKg: 19000, odometer: 312000, acquisitionCost: 3100000, region: "South", status: "IN_SHOP" },
  { registrationNo: "RJ-14-IJ-7890", name: "BharatBenz 1617R", type: "Truck", maxLoadKg: 16500, odometer: 189000, acquisitionCost: 2800000, region: "West", status: "AVAILABLE" },
  { registrationNo: "GJ-06-KL-2345", name: "Tata Winger", type: "Van", maxLoadKg: 1500, odometer: 56000, acquisitionCost: 950000, region: "West", status: "AVAILABLE" },
  { registrationNo: "UP-32-MN-6789", name: "Volvo B8R", type: "Bus", maxLoadKg: 14000, odometer: 420000, acquisitionCost: 8500000, region: "North", status: "ON_TRIP" },
  { registrationNo: "MP-09-QR-3344", name: "Tata Ace Gold", type: "Van", maxLoadKg: 750, odometer: 92000, acquisitionCost: 450000, region: "Central", status: "AVAILABLE" },
];

const DRIVERS = [
  { name: "Rajesh Kumar", email: "rajesh.kumar@transitops-drivers.com", licenseNumber: "DL-0420110012345", licenseCategory: "HMV", licenseExpiry: "2027-03-15", contactNumber: "+91-9876543210", safetyScore: 87, status: "AVAILABLE" },
  { name: "Suresh Patel", email: "suresh.patel@transitops-drivers.com", licenseNumber: "GJ-0620090098765", licenseCategory: "HMV", licenseExpiry: "2027-08-20", contactNumber: "+91-9123456780", safetyScore: 92, status: "ON_TRIP" },
  { name: "Anil Sharma", email: "anil.sharma@transitops-drivers.com", licenseNumber: "RJ-1420150054321", licenseCategory: "Transport", licenseExpiry: "2026-12-01", contactNumber: "+91-8765432190", safetyScore: 78, status: "AVAILABLE" },
  { name: "Mohammad Irfan", email: "mohammad.irfan@transitops-drivers.com", licenseNumber: "UP-3220170011223", licenseCategory: "HMV", licenseExpiry: "2027-05-10", contactNumber: "+91-7654321098", safetyScore: 91, status: "ON_TRIP" },
  { name: "Vikram Singh", email: "vikram.singh@transitops-drivers.com", licenseNumber: "HR-2620160033445", licenseCategory: "HMV", licenseExpiry: "2026-09-30", contactNumber: "+91-9988776655", safetyScore: 72, status: "AVAILABLE" },
  { name: "Pradeep Nair", email: "pradeep.nair@transitops-drivers.com", licenseNumber: "KA-0520180055667", licenseCategory: "LMV", licenseExpiry: "2027-02-28", contactNumber: "+91-8877665544", safetyScore: 88, status: "OFF_DUTY" },
];

// Trips reference vehicles/drivers by index into the arrays above
const TRIPS = [
  { source: "Mumbai", destination: "Delhi", vehicleIdx: 1, driverIdx: 1, cargoWeightKg: 12000, plannedDistance: 1400, status: "DISPATCHED", dispatchedAt: "2026-07-10T08:00:00", revenue: 85000 },
  { source: "Bangalore", destination: "Chennai", vehicleIdx: 6, driverIdx: 3, cargoWeightKg: 10000, plannedDistance: 350, status: "DISPATCHED", dispatchedAt: "2026-07-11T06:00:00", revenue: 32000 },
  { source: "Pune", destination: "Nagpur", vehicleIdx: 0, driverIdx: 2, cargoWeightKg: 5000, plannedDistance: 720, status: "DRAFT", revenue: 0 },
  { source: "Jaipur", destination: "Ahmedabad", vehicleIdx: 4, driverIdx: 4, cargoWeightKg: 8000, plannedDistance: 660, status: "DRAFT", revenue: 0 },
  { source: "Delhi", destination: "Lucknow", vehicleIdx: 4, driverIdx: 2, cargoWeightKg: 14000, plannedDistance: 550, status: "COMPLETED", dispatchedAt: "2026-07-06T07:00:00", completedAt: "2026-07-08T16:00:00", revenue: 42000, startOdometer: 188000, endOdometer: 188550, fuelConsumedL: 165 },
  { source: "Kolkata", destination: "Bhopal", vehicleIdx: 7, driverIdx: 4, cargoWeightKg: 7500, plannedDistance: 1600, status: "COMPLETED", dispatchedAt: "2026-07-02T05:00:00", completedAt: "2026-07-05T20:00:00", revenue: 95000, startOdometer: 91000, endOdometer: 92600, fuelConsumedL: 480 },
  { source: "Hyderabad", destination: "Mumbai", vehicleIdx: 0, driverIdx: 0, cargoWeightKg: 20000, plannedDistance: 710, status: "COMPLETED", dispatchedAt: "2026-06-29T08:00:00", completedAt: "2026-07-01T12:00:00", revenue: 55000, startOdometer: 144000, endOdometer: 144710, fuelConsumedL: 210 },
  { source: "Surat", destination: "Indore", vehicleIdx: 5, driverIdx: 5, cargoWeightKg: 1200, plannedDistance: 400, status: "CANCELLED", cancelledAt: "2026-07-09T11:00:00", revenue: 0 },
  { source: "Chandigarh", destination: "Delhi", vehicleIdx: 7, driverIdx: 4, cargoWeightKg: 9000, plannedDistance: 250, status: "COMPLETED", dispatchedAt: "2026-06-27T06:00:00", completedAt: "2026-06-28T10:00:00", revenue: 18000, startOdometer: 419500, endOdometer: 419750, fuelConsumedL: 95 },
  { source: "Chennai", destination: "Hyderabad", vehicleIdx: 2, driverIdx: 5, cargoWeightKg: 800, plannedDistance: 630, status: "COMPLETED", dispatchedAt: "2026-06-24T04:00:00", completedAt: "2026-06-25T15:00:00", revenue: 28000, startOdometer: 77800, endOdometer: 78450, fuelConsumedL: 62 },
];

// Fuel logs reference vehicles by index, optionally tied to a trip by index
const FUEL_LOGS = [
  { vehicleIdx: 0, tripIdx: 6, liters: 120, cost: 10800, loggedAt: "2026-07-08" },
  { vehicleIdx: 1, tripIdx: null, liters: 200, cost: 18000, loggedAt: "2026-07-10" },
  { vehicleIdx: 4, tripIdx: 4, liters: 150, cost: 13500, loggedAt: "2026-07-06" },
  { vehicleIdx: 7, tripIdx: 8, liters: 180, cost: 16200, loggedAt: "2026-07-11" },
  { vehicleIdx: 2, tripIdx: 9, liters: 45, cost: 4050, loggedAt: "2026-07-09" },
  { vehicleIdx: 7, tripIdx: 5, liters: 100, cost: 9000, loggedAt: "2026-07-07" },
  { vehicleIdx: 5, tripIdx: null, liters: 60, cost: 5400, loggedAt: "2026-07-05" },
  { vehicleIdx: 3, tripIdx: null, liters: 40, cost: 3600, loggedAt: "2026-07-04" },
  { vehicleIdx: 0, tripIdx: null, liters: 130, cost: 11700, loggedAt: "2026-06-25" },
  { vehicleIdx: 1, tripIdx: null, liters: 210, cost: 18900, loggedAt: "2026-06-22" },
];

async function seedVehicles() {
  const vehicles = [];
  for (const v of VEHICLES) {
    const vehicle = await prisma.vehicle.upsert({
      where: { registrationNo: v.registrationNo },
      update: {},
      create: v,
    });
    vehicles.push(vehicle);
  }
  console.log(`Vehicles ready: ${vehicles.length}`);
  return vehicles;
}

async function seedDrivers() {
  const drivers = [];
  for (const d of DRIVERS) {
    const driver = await prisma.driver.upsert({
      where: { licenseNumber: d.licenseNumber },
      update: {},
      create: { ...d, licenseExpiry: new Date(d.licenseExpiry) },
    });
    drivers.push(driver);
  }
  console.log(`Drivers ready: ${drivers.length}`);
  return drivers;
}

async function seedTrips(vehicles, drivers) {
  const trips = [];
  for (const t of TRIPS) {
    const { vehicleIdx, driverIdx, dispatchedAt, completedAt, cancelledAt, ...rest } = t;
    const trip = await prisma.trip.create({
      data: {
        ...rest,
        vehicleId: vehicles[vehicleIdx].id,
        driverId: drivers[driverIdx].id,
        dispatchedAt: dispatchedAt ? new Date(dispatchedAt) : null,
        completedAt: completedAt ? new Date(completedAt) : null,
        cancelledAt: cancelledAt ? new Date(cancelledAt) : null,
      },
    });
    trips.push(trip);
  }
  console.log(`Trips created: ${trips.length}`);
  return trips;
}

async function seedFuelLogs(vehicles, trips) {
  const existing = await prisma.fuelLog.count();
  if (existing > 0) {
    console.log(`Fuel logs already present (${existing}) — skipping fuel log seed.`);
    return;
  }

  for (const f of FUEL_LOGS) {
    await prisma.fuelLog.create({
      data: {
        vehicleId: vehicles[f.vehicleIdx].id,
        tripId: f.tripIdx !== null && trips[f.tripIdx] ? trips[f.tripIdx].id : null,
        liters: f.liters,
        cost: f.cost,
        loggedAt: new Date(f.loggedAt),
      },
    });
  }
  console.log(`Fuel logs created: ${FUEL_LOGS.length}`);
}

async function main() {
  const vehicles = await seedVehicles();
  const drivers = await seedDrivers();
  const trips = await seedTrips(vehicles, drivers);
  await seedFuelLogs(vehicles, trips);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
