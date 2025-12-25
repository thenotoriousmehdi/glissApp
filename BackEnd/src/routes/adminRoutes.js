
import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { getAllContacts } from "../controllers/adminController.js";

const router = express.Router();

router.get("/contacts", authMiddleware, getAllContacts);

export default router;
