import { Router } from "express";
import { getKpis } from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/kpis").get(getKpis);

export default router;
