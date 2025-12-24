import express from "express";
import { submitContactWithAnswers } from "../controllers/contactController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, submitContactWithAnswers);

export default router;