import prisma from "../db/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";
import { extractVehicleDocumentDetails } from "../services/vehicleDocument.service.js";
import { uploadImageBuffer } from "../services/cloudinary.service.js";

export const extractVehicleDocuments = asyncHandler(async (req, res) => {
  const files = req.files || [];

  if (files.length === 0) {
    return res.status(400).json({
      success: false,
      message: "At least one document image is required",
    });
  }

  // Uploads must succeed independently of extraction — a Gemini failure (e.g. quota)
  // shouldn't discard images that were successfully uploaded to Cloudinary.
  const [extractedResult, uploads] = await Promise.all([
    extractVehicleDocumentDetails(files).catch((err) => {
      console.error("Vehicle document extraction failed:", err.message);
      return null;
    }),
    Promise.all(
      files.map((file) =>
        uploadImageBuffer(file.buffer, { folder: "transitops/vehicle-documents" })
      )
    ),
  ]);

  const extracted = extractedResult || {
    rcNumber: "",
    insuranceNumber: "",
    insuranceExpiry: "",
    pucNumber: "",
    pucExpiry: "",
  };

  return res.status(200).json({
    success: true,
    extractionFailed: !extractedResult,
    data: {
      ...extracted,
      documentUrls: uploads.map((u) => u.secure_url),
    },
  });
});

export const createVehicle = asyncHandler(async (req, res) => {
  console.log("Request body:", req.body); // Log the request body for debugging
  const {
    registrationNo,
    name,
    type,
    maxLoadKg,
    odometer,
    acquisitionCost,
    region,
    rcNumber,
    insuranceNumber,
    insuranceExpiry,
    pucNumber,
    pucExpiry,
    documentUrls,
  } = req.body;

  if (!registrationNo || !name || !type || !maxLoadKg || !acquisitionCost) {
    return res.status(400).json({
      success: false,
      message:
        "registrationNo, name, type, maxLoadKg and acquisitionCost are required",
    });
  }

  try {
    const vehicle = await prisma.vehicle.create({
      data: {
        registrationNo,
        name,
        type,
        maxLoadKg,
        odometer: odometer ?? 0,
        acquisitionCost,
        region,
        ...(rcNumber && { rcNumber }),
        ...(insuranceNumber && { insuranceNumber }),
        ...(insuranceExpiry && { insuranceExpiry: new Date(insuranceExpiry) }),
        ...(pucNumber && { pucNumber }),
        ...(pucExpiry && { pucExpiry: new Date(pucExpiry) }),
        ...(insuranceExpiry && { insuranceExpired: new Date(insuranceExpiry) < new Date() }),
        ...(Array.isArray(documentUrls) && documentUrls.length > 0 && { documentUrls }),
      },
    });
    return res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A vehicle with this registration number already exists",
      });
    }
    throw error;
  }
});

export const getVehicles = asyncHandler(async (req, res) => {
  const { status, type, region } = req.query;

  const vehicles = await prisma.vehicle.findMany({
    where: {
      ...(status && { status }),
      ...(type && { type }),
      ...(region && { region }),
    },
    orderBy: { createdAt: "desc" },
  });

  return res.status(200).json({ success: true, data: vehicles });
});

export const getVehicleById = asyncHandler(async (req, res) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: req.params.id },
  });

  if (!vehicle) {
    return res
      .status(404)
      .json({ success: false, message: "Vehicle not found" });
  }

  return res.status(200).json({ success: true, data: vehicle });
});

export const updateVehicle = asyncHandler(async (req, res) => {
  const {
    name,
    type,
    maxLoadKg,
    region,
    odometer,
    acquisitionCost,
    rcNumber,
    insuranceNumber,
    insuranceExpiry,
    pucNumber,
    pucExpiry,
    documentUrls,
  } = req.body;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: req.params.id },
  });

  if (!vehicle) {
    return res
      .status(404)
      .json({ success: false, message: "Vehicle not found" });
  }

  const updated = await prisma.vehicle.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type }),
      ...(maxLoadKg !== undefined && { maxLoadKg }),
      ...(region !== undefined && { region }),
      ...(odometer !== undefined && { odometer }),
      ...(acquisitionCost !== undefined && { acquisitionCost }),
      ...(rcNumber !== undefined && { rcNumber }),
      ...(insuranceNumber !== undefined && { insuranceNumber }),
      ...(pucNumber !== undefined && { pucNumber }),
      ...(pucExpiry !== undefined && { pucExpiry: pucExpiry ? new Date(pucExpiry) : null }),
      ...(insuranceExpiry !== undefined && {
        insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
        insuranceExpired: insuranceExpiry ? new Date(insuranceExpiry) < new Date() : false,
      }),
      ...(Array.isArray(documentUrls) && { documentUrls }),
    },
  });

  return res.status(200).json({ success: true, data: updated });
});

export const retireVehicle = asyncHandler(async (req, res) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: req.params.id },
  });

  if (!vehicle) {
    return res
      .status(404)
      .json({ success: false, message: "Vehicle not found" });
  }

  if (vehicle.status === "ON_TRIP") {
    return res.status(400).json({
      success: false,
      message: "Cannot retire a vehicle that is currently on a trip",
    });
  }

  const updated = await prisma.vehicle.update({
    where: { id: req.params.id },
    data: { status: "RETIRED" },
  });

  return res.status(200).json({ success: true, data: updated });
});
