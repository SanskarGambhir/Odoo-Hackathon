import prisma from "../db/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generateAccessToken, generateRefreshToken } from "../utils/generateTokens.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

export const registerUser = async (req, res) => {
  try {
    const username = req.body.username?.trim().toLowerCase();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password?.trim();

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
        ],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token in DB
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        refreshToken,
      },
    });

    return res
      .status(201)
      .cookie(
        "accessToken",
        accessToken,
        cookieOptions
      )
      .cookie(
        "refreshToken",
        refreshToken,
        cookieOptions
      )
      .json({
        success: true,
        message:
          "User registered and logged in successfully",
        user,
      });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const username = req.body.username?.trim().toLowerCase();
    const password = req.body.password?.trim();

    if ((!email && !username) || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/Username and password are required",
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { username: username || undefined },
        ],
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        refreshToken,
      },
    });

    const loggedInUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res
      .status(200)
      .cookie(
        "accessToken",
        accessToken,
        cookieOptions
      )
      .cookie(
        "refreshToken",
        refreshToken,
        cookieOptions
      )
      .json({
        success: true,
        message: "Login successful",
        user: loggedInUser,
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const logoutUser = async (req, res) => {
  try {
    await prisma.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        refreshToken: null,
      },
    });

    return res
      .status(200)
      .clearCookie(
        "accessToken",
        cookieOptions
      )
      .clearCookie(
        "refreshToken",
        cookieOptions
      )
      .json({
        success: true,
        message: "Logged out successfully",
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCurrentUser = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

export const refreshAccessToken = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken ||  req.body?.refreshToken;

    if (!incomingRefreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await prisma.user.findUnique({
      where: {
        id: decodedToken.id,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    if (user.refreshToken !== incomingRefreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token expired or reused",
      });
    }

    const accessToken =
      generateAccessToken(user);

    return res
      .status(200)
      .cookie(
        "accessToken",
        accessToken,
        cookieOptions
      )
      .json({
        success: true,
        accessToken,
      });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};
