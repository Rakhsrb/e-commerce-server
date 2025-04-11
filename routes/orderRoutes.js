import exress from "express";
import {
  AllOrders,
  GetOneOrder,
  GetOneOrderById,
  NewOrder,
  OrderUpdate,
} from "../controllers/orderController.js";

const router = exress.Router();

router.get("/", AllOrders);
router.get("/:id", GetOneOrderById);
router.get("/orderId", GetOneOrder);
router.post("/", NewOrder);
router.put("/:id", OrderUpdate);

export default router;
