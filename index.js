import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import router from "./router/index.js";

const PORT = process.env.PORT || 5001;
const app = express();

dotenv.config();
app.use(cors());
app.use(express.json());

app.use("/api", router);


const start = async () => {
  try {
    await mongoose.set("strictQuery", false);
    await mongoose.connect(
      process.env.MONGODB_URI
    );
    app.listen(PORT, () => {
      console.log(`server started on port ${process.env.PORT}`);
    });
  } catch (e) {
    console.log(e);
  }
};



start();
