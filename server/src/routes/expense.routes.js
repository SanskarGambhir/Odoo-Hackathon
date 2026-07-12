import { Router } from "express";
import {
  createExpense,
  getExpenses,
} from "../controllers/expense.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(createExpense).get(getExpenses);

export default router;
