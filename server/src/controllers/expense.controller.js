import prisma from "../db/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createExpense = asyncHandler(async (req, res) => {
  const { vehicleId, tripId, type, amount, note, incurredAt } = req.body;

  if (!vehicleId || !type || amount == null) {
    return res.status(400).json({
      success: false,
      message: "vehicleId, type and amount are required",
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

  const expense = await prisma.expense.create({
    data: {
      vehicleId,
      ...(tripId && { tripId }),
      type,
      amount,
      note,
      ...(incurredAt && { incurredAt: new Date(incurredAt) }),
    },
  });

  return res.status(201).json({ success: true, data: expense });
});

export const getExpenses = asyncHandler(async (req, res) => {
  const { vehicleId, tripId, type } = req.query;

  const expenses = await prisma.expense.findMany({
    where: {
      ...(vehicleId && { vehicleId }),
      ...(tripId && { tripId }),
      ...(type && { type }),
    },
    orderBy: { incurredAt: "desc" },
  });

  return res.status(200).json({ success: true, data: expenses });
});
