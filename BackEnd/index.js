import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./src/routes/authRoutes.js";
import contactRoutes from "./src/routes/contactRoutes.js";
import questionRoutes from "./src/routes/questionRoutes.js";
import prisma from "./lib/prisma.js";

dotenv.config();

const app = express();
app.set("trust proxy", 1);

app.use(cors({
  origin: ["http://localhost:5173", "https://glissapp-five.vercel.app"] ,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}))

app.use(cookieParser());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/contacts", contactRoutes);
app.use("/questions", questionRoutes);
app.get("/", (req, res) => {
  res.send("API is running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
