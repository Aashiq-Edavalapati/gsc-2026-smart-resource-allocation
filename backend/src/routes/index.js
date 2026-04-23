import express from "express";
import usersRoutes from "./user.route.js";
import orgRoutes from './org.route.js';

const router = express.Router();

router.use("/users", usersRoutes);
router.use("/organizations", orgRoutes);

export default router;