import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { getActiveQuestions } from "../controllers/questionController.js";

const router = express.Router();

router.get("/active", authMiddleware, getActiveQuestions);

export default router;
