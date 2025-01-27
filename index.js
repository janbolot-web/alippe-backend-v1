import dotenv from "dotenv";
import http from "http";
import mongoose from "mongoose";
import app from "./app.js";
import { setupSocket } from "./socket.js";
import schedule from "node-schedule";
import userModel from "./models/user-model.js";

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

schedule.scheduleJob("0 0 * * *", async () => {
  const now = new Date();

  const result = await userModel.updateMany(
    { "subscription.isActive": true, "subscription.expiresAt": { $lte: now } },
    {
      $set: {
        "subscription.$[elem].isActive": false,
      },
    },
    {
      arrayFilters: [
        { "elem.isActive": true, "elem.expiresAt": { $lte: now } },
      ],
    }
  );

  console.log(
    `Обновлено пользователей с истекшей подпиской: ${result.modifiedCount}`
  );
});

start();
