import prisma from "../db/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createDriver = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    licenseNumber,
    licenseCategory,
    licenseExpiry,
    contactNumber,
    safetyScore,
    userId,
  } = req.body;

  if (!name || !email || !licenseNumber || !licenseCategory || !licenseExpiry || !contactNumber) {
    return res.status(400).json({
      success: false,
      message:
        "name, email, licenseNumber, licenseCategory, licenseExpiry and contactNumber are required",
    });
  }

  try {
    const driver = await prisma.driver.create({
      data: {
        name,
        email: email.trim().toLowerCase(),
        licenseNumber,
        licenseCategory,
        licenseExpiry: new Date(licenseExpiry),
        contactNumber,
        safetyScore: safetyScore ?? 100,
        ...(userId && { userId }),
      },
    });
    return res.status(201).json({ success: true, data: driver });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A driver with this license number or email already exists",
      });
    }
    throw error;
  }
});

export const getDrivers = asyncHandler(async (req, res) => {
  console.log("Query parameters:", req.query); // Log the query parameters for debugging
  const { status, licenseCategory } = req.query;

  const drivers = await prisma.driver.findMany({
    where: {
      ...(status && { status }),
      ...(licenseCategory && { licenseCategory }),
    },
    orderBy: { createdAt: "desc" },
  });
  return res.status(200).json({ success: true, data: drivers });
});

export const getDriverById = asyncHandler(async (req, res) => {
  const driver = await prisma.driver.findUnique({
    where: { id: req.params.id },
  });

  if (!driver) {
    return res
      .status(404)
      .json({ success: false, message: "Driver not found" });
  }

  return res.status(200).json({ success: true, data: driver });
});

export const updateDriver = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    licenseNumber,
    licenseCategory,
    licenseExpiry,
    contactNumber,
    safetyScore,
  } = req.body;

  const driver = await prisma.driver.findUnique({
    where: { id: req.params.id },
  });

  if (!driver) {
    return res
      .status(404)
      .json({ success: false, message: "Driver not found" });
  }

  try {
    const updated = await prisma.driver.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email: email.trim().toLowerCase() }),
        ...(licenseNumber !== undefined && { licenseNumber }),
        ...(licenseCategory !== undefined && { licenseCategory }),
        ...(licenseExpiry !== undefined && {
          licenseExpiry: new Date(licenseExpiry),
        }),
        ...(contactNumber !== undefined && { contactNumber }),
        ...(safetyScore !== undefined && { safetyScore }),
      },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A driver with this license number or email already exists",
      });
    }
    throw error;
  }
});

export const suspendDriver = asyncHandler(async (req, res) => {
  const driver = await prisma.driver.findUnique({
    where: { id: req.params.id },
  });

  if (!driver) {
    return res
      .status(404)
      .json({ success: false, message: "Driver not found" });
  }

  if (driver.status === "ON_TRIP") {
    return res.status(400).json({
      success: false,
      message: "Cannot suspend a driver that is currently on a trip",
    });
  }

  const updated = await prisma.driver.update({
    where: { id: req.params.id },
    data: { status: "SUSPENDED" },
  });

  return res.status(200).json({ success: true, data: updated });
});

export const deleteDriver = asyncHandler(async (req, res) => {
  const driver = await prisma.driver.findUnique({
    where: { id: req.params.id },
  });

  if (!driver) {
    return res
      .status(404)
      .json({ success: false, message: "Driver not found" });
  }

  if (driver.status === "ON_TRIP") {
    return res.status(400).json({
      success: false,
      message: "Cannot delete a driver that is currently on a trip",
    });
  }

  await prisma.driver.delete({ where: { id: req.params.id } });

  return res
    .status(200)
    .json({ success: true, message: "Driver deleted" });
});
