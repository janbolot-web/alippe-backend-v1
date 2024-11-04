import { Server } from "socket.io";
import Room from "./models/room.js";

export const setupSocket = (server) => {
  const io = new Server(server);


  io.on("connection", (socket) => {
    console.log("connected!");
    socket.on("createRoom", async ({ nickname, response }) => {
      try {
        const data = JSON.parse(response);
        let room = new Room();
  
        let player = {
          socketID: socket.id,
          nickname,
          playerType: "X",
          correctAnswer: "0",
        };
        room.players.push(player);
        room.questions = data.questions;
        room.time = data.time;
        room = await room.save();
        const roomId = room._id.toString();
        socket.join(roomId);
        var roomData = [{ room, playerId: socket.id }];
        io.to(roomId).emit("createRoomSuccess", roomData);
        // console.log('response');
      } catch (error) {
        console.log(error);
      }
    });
    socket.on("joinRoom", async ({ nickname, roomId }) => {
      try {
        if (!roomId.match(/^[0-9a-fA-F]{24}$/)) {
          socket.emit("errorOccured", "please enter a valid code room ID");
          return;
        }
  
        let room = await Room.findById(roomId);
  
        if (room.isJoin) {
          // Проверка на наличие игрока с тем же socketID
          let existingPlayer = room.players.find(
            (player) => player.socketID === socket.id
          );
  
          if (existingPlayer) {
            socket.emit(
              "errorOccured",
              "Player with this socketID already exists in the room"
            );
            return;
          }
  
          let player = {
            nickname,
            socketID: socket.id, // Уникальный socketID
            playerType: "O",
            correctAnswer: "0",
            points: 0, // Инициализация очков
          };
          socket.join(roomId);
          room.players.push(player);
          room = await room.save();
          // Отправка обновленного игрока и socketID клиенту
          var roomData = [{ room, playerId: socket.id }];
          io.to(socket.id).emit("joinRoomSuccess", roomData);
          io.to(roomId).emit("updateRoom", room);
        } else {
          socket.emit(
            "errorOccured",
            "Игра уже началось, вы не можете присоединиться"
          );
          return;
        }
      } catch (error) {
        console.log(error);
      }
    });
  
    socket.on("startGame", async ({ roomId }) => {
      try {
        if (!roomId.match(/^[0-9a-fA-F]{24}$/)) {
          socket.emit("errorOccured", "please enter a valid code room ID");
          console.log("err");
          return;
        }
        let room = await Room.findById(roomId);
        room.isJoin = false;
        room = await room.save();
        var roomData = [{ room, playerId: null }];
  
        io.to(roomId).emit("updateRoom", room);
        console.log(roomId);
      } catch (error) {
        console.log(error);
      }
    });
  
    socket.on(
      "tap",
      async ({
        points,
        roomId,
        playerId,
        correct,
        question,
        answer,
        correctAnswer,
      }) => {
        try {
          let room = await Room.findById(roomId);
          let player = room.players.find(
            (player) => player.socketID === playerId
          );
          player.hasAnswered = true;
          player.result.push({
            question: question,
            answer: answer,
            correct: correct,
            correctAnswer: correctAnswer,
          });
          console.log(player.result);
  
          if (correct) {
            if (player) {
              player.points = player.points + points;
              player.correctAnswer = player.correctAnswer + 1;
            } else {
              console.log("Player not found in the room");
              // res.status(404).json({ message: "Player not found in the room" });
            }
            io.to(roomId).emit("updateRoom", room);
          }
  
          io.to(roomId).emit("updateRoom", room);
          await room.save();
        } catch (error) {
          console.log(error);
        }
      }
    );
    socket.on("hasAnswers", async ({ roomId }) => {
      try {
        let room = await Room.findById(roomId);
        await room.save();
        io.to(roomId).emit("updateRoom", room);
      } catch (error) {
        console.log(error);
      }
    });
    socket.on("end", async ({ roomId, endGame, playerId }) => {
      try {
        let room = await Room.findById(roomId);
        const data = {
          endGame: endGame,
          playerId: playerId,
        };
        let player = room.players.find((player) => player.playerType === "X");
  
        // Отправляем обновлённые данные комнаты всем игрокам
        io.to(roomId).emit("updateRoom", room);
        console.log("player ", player.socketID);
        // Отправляем событие endGame только инициатору
        io.to(socket.id).emit("endGame", data);
        io.to(player.socketID).emit("endGame", data);
      } catch (e) {
        console.log(e);
      }
    });
  });
};
