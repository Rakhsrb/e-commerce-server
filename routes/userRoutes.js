import express from "express";
import {
    GetOneUserById,
    GetUsersByPhoneNumber,
    GetUsersByRole
} from "../controllers/userController";

const router = express.Router();

router.get("/:id", GetOneUserById);
router.get("/role", GetUsersByRole);
router.get("/phone", GetUsersByPhoneNumber);

export default router;
