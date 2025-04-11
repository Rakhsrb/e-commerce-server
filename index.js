import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import morgan from "morgan"

import AuthRoutes from "./routes/authRoutes.js";
import UserRoutes from "./routes/userRoutes.js";
import AdminRoutes from "./routes/adminRoutes.js";
import ClientRoutes from "./routes/clientRoutes.js";
import StaffRoutes from "./routes/staffRoutes.js";
import ProductRoutes from "./routes/productRoutes.js";
import OrderRoutes from "./routes/orderRoutes.js";
import BranchRoutes from "./routes/branchRoutes.js";


dotenv.config();
const app = express();
app.use(morgan("dev"))
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));
app.get("/", (_, res) => res.send("Hello world!"));

app.use("/api/login", AuthRoutes);
app.use("/api/user", UserRoutes);
app.use("/api/admin", AdminRoutes);
app.use("/api/client", ClientRoutes);
app.use("/api/staff", StaffRoutes);
app.use("/api/product", ProductRoutes);
app.use("/api/order", OrderRoutes);
app.use("/api/branch", BranchRoutes);

const startApp = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    app.listen(process.env.PORT, () =>
      console.log(`server is running on http://localhost:${process.env.PORT}`)
    );
  } catch (error) {
    console.log(error);
  }
};

startApp();
