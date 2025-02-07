import mongoose from "mongoose";

const purchaseHistorySchema = new mongoose.Schema(
  {
    paymentId: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    pointsEarned: { type: Number, required: true },
    currency: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    authCode: { type: String, required: true },
    pgSalt: { type: String, required: true },
    pgSig: { type: String, required: true },
    cardName: { type: String, required: true },
    userPhone: { type: String, required: true },
    userEmail: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("PurchaseHistory", purchaseHistorySchema);
