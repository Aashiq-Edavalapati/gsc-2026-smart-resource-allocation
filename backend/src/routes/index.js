import express from "express";
import usersRoutes from "./user.route.js";
import orgRoutes from './org.route.js';
import issueRoutes from './issue.route.js';
import taskRoutes from './task.route.js';
import trustRoutes from './trust.route.js';
import adminRoutes from './admin.route.js';
import aiRoutes from './ai.route.js';
import noticationfRoutes from './notification.route.js';
import uploadRoutes from './upload.route.js';

const router = express.Router();

router.use("/users", usersRoutes);
router.use("/organizations", orgRoutes);
router.use("/issues", issueRoutes);
router.use("/tasks", taskRoutes);
router.use("/trust", trustRoutes);
router.use("/admin", adminRoutes);
router.use("/ai", aiRoutes);
router.use("/notifications", noticationfRoutes);
router.use("/upload", uploadRoutes);

export default router;