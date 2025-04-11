import express from "express";
import { CreateNewClient } from "../controllers/clientController.js";
import { DeleteUser, Profile, UpdateUser } from "../controllers/userController.js";
import isAuth from "../middlewares/isAuth.js";


const router = express.Router();

router.get("/profile", isAuth, Profile);
router.post("/", CreateNewClient);
router.delete("/:id", DeleteUser);
router.put("/:id", UpdateUser);

export default router;
