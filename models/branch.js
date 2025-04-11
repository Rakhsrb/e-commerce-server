import mongoose from "mongoose";

const Branch = new mongoose.Schema({
    address: { type: String, required: true },
    worktime: {
        from: { type: String, required: true },
        to: { type: String, required: true }
    },
    name: { type: String, required: true },
    location: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    staffs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
    }],
})

export default mongoose.model('Branch', Branch)