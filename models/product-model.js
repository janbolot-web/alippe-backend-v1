import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    // category: { type: String, required: true },
    category: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    imagesUrl: [{ type: String }],
    stock: { type: Number },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop" },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Product", productSchema);
