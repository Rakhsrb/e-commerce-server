import User from "../models/user.js";
import Order from "../models/order.js";
import Branch from "../models/branch.js";
import Product from "../models/product.js";

export const AllOrders = async (req, res) => {
  const { pageNum = 1, pageSize = 10 } = req.query;
  try {
    const total = await Order.countDocuments();
    const orders = await Order.find()
      .populate(["customer", "products"])
      .skip((pageNum - 1) * pageSize)
      .limit(parseInt(pageSize));

    return res.status(200).json({ total, data: orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ message: "Server error!" });
  }
};

export const GetOneOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id).populate(["customer", "products"]);

    if (!order) return res.status(404).json({ message: "Order not found!" });

    return res.status(200).json({ data: order });
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({ message: "Server error!" });
  }
};

export const GetOneOrder = async (req, res) => {
  try {
    const { orderId } = req.query;

    const order = await Order.findOne({ orderId }).populate([
      "customer",
      "products",
    ]);

    if (!order) return res.status(404).json({ message: "Order not found!" });

    return res.status(200).json({ data: order });
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({ message: "Server error!" });
  }
};

export const NewOrder = async (req, res) => {
  try {
    const {
      customer,
      products,
      status,
      orderId,
      totalPrice,
      amount,
      orderType,
      pickupDetails,
      deliveryDetails,
    } = req.body;

    if (
      !customer ||
      !products ||
      !status ||
      !orderId ||
      !totalPrice ||
      !amount ||
      !orderType
    ) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    if (!Array.isArray(products) || products.length === 0) {
      return res
        .status(400)
        .json({ message: "Products must be a non-empty array!" });
    }

    if (typeof totalPrice !== "number" || totalPrice <= 0) {
      return res
        .status(400)
        .json({ message: "Total price must be a positive number!" });
    }

    if (typeof amount !== "number" || amount <= 0) {
      return res
        .status(400)
        .json({ message: "amount must be a positive number!" });
    }

    if (orderType === "Pickup" && !pickupDetails?.storeId) {
      return res
        .status(400)
        .json({ message: "Pickup store ID is required for pickup orders!" });
    }

    if (
      orderType === "Delivery" &&
      (!deliveryDetails?.address ||
        !deliveryDetails?.city ||
        !deliveryDetails?.postalCode ||
        !deliveryDetails?.phoneNumber)
    ) {
      return res.status(400).json({
        message: "Complete delivery details are required for delivery orders!",
      });
    }

    for (const product of products) {
      const dbProduct = await Product.findById(product.productId);
      if (!dbProduct) {
        return res
          .status(404)
          .json({ message: `Product with ID ${product.productId} not found!` });
      }
      if (dbProduct.stock < product.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for product ${dbProduct.name}!`,
        });
      }

      dbProduct.stock -= product.quantity;
      await dbProduct.save();
    }

    const newOrder = new Order(req.body);
    const savedOrder = await newOrder.save();

    const client = await User.findById(customer);
    if (client) {
      client.orders.push(savedOrder._id);
      await client.save();
    }

    if (orderType === "Pickup") {
      const branch = await Branch.findById(newOrder.pickupDetails.storeId);
      if (branch) {
        branch.orders.push(savedOrder._id);
        await branch.save();
      }
    }

    return res.status(201).json({ data: savedOrder });
  } catch (error) {
    return res.status(500).json({ message: "Server error!" });
  }
};

export const OrderUpdate = async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  try {
    const updatedOrder = await Order.findByIdAndUpdate(id, updatedData, {
      new: true,
    });

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({
      message: "Order updated successfully",
      data: updatedOrder,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to update order", error: error.message });
  }
};
