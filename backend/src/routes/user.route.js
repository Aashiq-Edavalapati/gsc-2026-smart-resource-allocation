import express from "express";
import {
  syncUser,
  getMe,
  updateMe,
  getUserById,
  upsertVolunteerProfile,
  registerDeviceToken,
  getTrustScoreHistory,
  deleteMyAccount
} from "../controllers/user.controller.js";
import { verifyFirebaseToken } from "../middlewares/auth.js";

const router = express.Router();

router.post("/sync", syncUser);

const protectedRouter = express.Router();
protectedRouter.use(verifyFirebaseToken);

protectedRouter.get("/me", getMe);
protectedRouter.put("/me", updateMe);
protectedRouter.delete("/me", deleteMyAccount);
protectedRouter.post("/volunteer-profile", upsertVolunteerProfile);
protectedRouter.post("/fcm-token", registerDeviceToken);
protectedRouter.get("/trust-score/history", getTrustScoreHistory);

protectedRouter.get('/:id', getUserById);

router.use("/", protectedRouter);

export default router;