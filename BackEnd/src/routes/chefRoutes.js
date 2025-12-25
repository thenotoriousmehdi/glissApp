
import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  createInventoryEntry,
  getChefDashboardStats,
  getAnimatorsStats,
  listChefAnimators,
} from "../controllers/chefController.js";

const router = express.Router();

router.get("/animators", authMiddleware, listChefAnimators);
router.get("/dashboard-stats", authMiddleware, getChefDashboardStats);
router.get("/animators-stats", authMiddleware, getAnimatorsStats);
router.post("/inventory", authMiddleware, createInventoryEntry);

export default router;
