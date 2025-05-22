import mongoose from "mongoose";

const VersionSchema = new mongoose.Schema({
  android: { type: String, required: true },
  ios: { type: String, required: true },
});

export default mongoose.model("Version", VersionSchema);
