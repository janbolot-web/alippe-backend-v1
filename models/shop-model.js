import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    logo: { type: String },
    author: [
      {
        name: { type: String },
        phoneNumber: { type: String },
        whatsapp: { type: String },
        instagram: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Shop", shopSchema);
