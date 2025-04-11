import exress from "express";
import {
  AddStaffToBranch,
  CreateNewBranch,
  DeleteBranch,
  DeleteStaffFromBranch,
  GetAllBranchs,
  GetOneBranch,
  UpdateBranch,
} from "../controllers/branchController.js";

const router = exress.Router();

router.get("/", GetAllBranchs);
router.get("/:id", GetOneBranch);
router.post("/", CreateNewBranch);
router.post("/add-staff", AddStaffToBranch);
router.delete("/delete-staff", DeleteStaffFromBranch);
router.put("/:id", UpdateBranch);
router.delete("/:id", DeleteBranch);

export default router;
