import mongoose from "mongoose";

const purchaseHistorySchema = new mongoose.Schema(
  {
    paymentId: { type: String },
    amount: { type: Number },
    date: { type: Date },
    pointsEarned: { type: Number },
    currency: { type: String },
    paymentMethod: { type: String },
    authCode: { type: String },
    pgSalt: { type: String },
    pgSig: { type: String },
    cardName: { type: String },
    userPhone: { type: String },
    userEmail: { type: String },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("PurchaseHistory", purchaseHistorySchema);
