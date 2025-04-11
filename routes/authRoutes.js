import express from "express";
import { Login } from "../controllers/authController";

const router = express.Router();

router.post("/", Login);

export default router;
