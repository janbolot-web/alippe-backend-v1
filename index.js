import dotenv from "dotenv";
import http from "http";
import mongoose from "mongoose";
import app from "./app.js";
import { setupSocket } from "./socket.js";

dotenv.config();

const PORT = process.env.PORT || 5001;
const server = http.createServer(app);
setupSocket(server);

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    server.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  } catch (e) {
    console.error(e);
  }
};

start();
