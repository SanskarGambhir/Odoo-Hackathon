import { Router } from "express";
import { createUser, getUsers, deleteUser } from "../controllers/user.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT, authorizeRoles("ADMIN"));

router.route("/").post(createUser).get(getUsers);
router.route("/:id").delete(deleteUser);

export default router;
