import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
    ],
    status: {
      type: String,
      required: true,
      enum: ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    orderId: { type: Number, required: true, unique: true },
    totalPrice: { type: Number, required: true },
    amount: {
      type: Number,
      required: true,
      default: 1,
    },
    orderType: {
      type: String,
      required: true,
      enum: ["Pickup", "Delivery"],
    },
    pickupDetails: {
      storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
        required: function () {
          return this.orderType === "Pickup";
        },
      },
    },
    deliveryDetails: {
      address: {
        type: String,
        required: function () {
          return this.orderType === "Delivery";
        },
      },
      city: {
        type: String,
        required: function () {
          return this.orderType === "Delivery";
        },
      },
      phoneNumber: {
        type: String,
        required: function () {
          return this.orderType === "Delivery";
        },
      },
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", OrderSchema);
export default Order;
