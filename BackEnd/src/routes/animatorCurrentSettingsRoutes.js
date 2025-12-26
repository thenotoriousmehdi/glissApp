import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  getCurrentSettings,
  patchCurrentSettings,
} from "../controllers/animatorCurrentSettingsController.js";

const router = express.Router();

router.get("/current-settings", authMiddleware, getCurrentSettings);
router.patch("/current-settings", authMiddleware, patchCurrentSettings);

export default router;
