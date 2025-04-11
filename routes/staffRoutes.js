import express from "express";
import { DeleteUser, Profile, UpdateUser } from "../controllers/userController.js";
import { CreateNewStaff } from "../controllers/staffController.js";
import isAuth from "../middlewares/isAuth.js";

const router = express.Router();

router.get("/profile", isAuth, Profile);
router.post("/", CreateNewStaff);
router.delete("/:id", DeleteUser);
router.put("/:id", UpdateUser);

export default router;
