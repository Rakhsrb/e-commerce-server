import mongoose from "mongoose";

const User = new mongoose.Schema(
  {
    phoneNumber: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    password: { type: String, required: true },
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
    role: { type: String, required: true },
    avatar: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("User", User);
