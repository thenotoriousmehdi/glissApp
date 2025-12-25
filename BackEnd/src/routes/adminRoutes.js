
import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  getAllContacts,
  getAnimatorsStats,
  getDashboardFilters,
  getDashboardQuestionsBreakdown,
  getDashboardSummary,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/contacts", authMiddleware, getAllContacts);
router.get("/animators/stats", authMiddleware, getAnimatorsStats);
router.get("/dashboard/filters", authMiddleware, getDashboardFilters);
router.get("/dashboard/summary", authMiddleware, getDashboardSummary);
router.get("/dashboard/questions", authMiddleware, getDashboardQuestionsBreakdown);

export default router;
