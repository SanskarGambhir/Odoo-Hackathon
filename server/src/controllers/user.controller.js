import prisma from "../db/prisma.js";
import bcrypt from "bcrypt";
import asyncHandler from "../utils/asyncHandler.js";

const VALID_ROLES = [
  "ADMIN",
  "FLEET_MANAGER",
  "DISPATCHER",
  "SAFETY_OFFICER",
  "FINANCIAL_ANALYST",
];

export const createUser = asyncHandler(async (req, res) => {
  const username = req.body.username?.trim().toLowerCase();
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password?.trim();
  const role = req.body.role;

  if (!username || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: "username, email, password and role are required",
    });
  }

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `role must be one of: ${VALID_ROLES.join(", ")}`,
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters long",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ success: true, data: user });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A user with this email or username already exists",
      });
    }
    throw error;
  }
});

export const getUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return res.status(200).json({ success: true, data: users });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (user.id === req.user.id) {
    return res.status(400).json({
      success: false,
      message: "You cannot delete your own account",
    });
  }

  await prisma.user.delete({ where: { id: req.params.id } });

  return res.status(200).json({ success: true, message: "User deleted" });
});
