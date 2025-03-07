import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import Room from "./models/room.js";

// Объект для хранения блокировок комнат для предотвращения race condition
const roomLocks = {};
// Объект для хранения интервалов синхронизации по комнатам
const roomSyncIntervals = {};

export const setupSocket = (server) => {
  const io = new Server(server);

  // Инициализация мониторинга
  setupMonitoring();
  // Запуск проверки зависших игр
  checkAndEndStaleGames();
  // Запуск очистки неактивных игроков
  clearInactivePlayersScheduler();

  // Централизованная функция для обновления состояния комнаты
  async function updateRoomState(roomId) {
    try {
      let room = await Room.findById(roomId);
      if (room) {
        // Обновляем время последней активности
        room.lastActivity = new Date();
        // Увеличиваем номер версии при каждом обновлении
        room.version = (room.version || 0) + 1;
        await room.save();

        // Отправляем всем участникам обновленную информацию о комнате
        io.to(roomId).emit("updateRoom", {
          room: room,
          version: room.version || 0,
          serverTime: Date.now(),
        });
      }
    } catch (error) {
      console.log("Error updating room state:", error);
    }
  }

  // Функция для периодической проверки состояния комнаты
  function scheduleRoomStateSync(roomId, interval = 5000) {
    // Очистим предыдущий интервал, если он существует
    if (roomSyncIntervals[roomId]) {
      clearInterval(roomSyncIntervals[roomId]);
    }

    const syncInterval = setInterval(async () => {
      try {
        const room = await Room.findById(roomId);
        if (!room || room.players.length === 0 || room.isCompleted) {
          clearInterval(syncInterval);
          delete roomSyncIntervals[roomId];
          return;
        }

        // Обновляем время последней активности
        room.lastActivity = new Date();
        await room.save();

        io.to(roomId).emit("updateRoom", {
          room: room,
          version: room.version || 0,
          serverTime: Date.now(),
        });
      } catch (error) {
        console.log("Error in sync interval:", error);
        clearInterval(syncInterval);
        delete roomSyncIntervals[roomId];
      }
    }, interval);

    // Сохраняем интервал, чтобы можно было его очистить при необходимости
    roomSyncIntervals[roomId] = syncInterval;
  }

  // Функция для безопасного выполнения операций с блокировкой комнаты
  async function withRoomLock(roomId, callback) {
    if (roomLocks[roomId]) {
      // Если комната заблокирована, ждем освобождения
      await new Promise((resolve) => {
        const checkLock = () => {
          if (!roomLocks[roomId]) {
            resolve();
          } else {
            setTimeout(checkLock, 50);
          }
        };
        checkLock();
      });
    }

    roomLocks[roomId] = true;
    try {
      await callback();
    } finally {
      roomLocks[roomId] = false;
    }
  }

  // Функция мониторинга активных комнат
  function setupMonitoring() {
    setInterval(async () => {
      try {
        const activeRooms = await Room.find({
          isCompleted: false,
        });

        console.log(`Active rooms: ${activeRooms.length}`);

        // Сохранение статистики
        const stats = {
          timestamp: Date.now(),
          activeRooms: activeRooms.length,
          totalPlayers: activeRooms.reduce(
            (acc, room) => acc + room.players.length,
            0
          ),
          roomsDetails: activeRooms.map((room) => ({
            id: room._id,
            players: room.players.length,
            questionsCount: room.questions?.length || 0,
            currentQuestion: room.currentQuestion,
            age: Date.now() - room.createdAt.getTime(),
          })),
        };

        console.log("Game statistics:", stats);
        // Здесь можно добавить сохранение статистики в БД или отправку в мониторинг
      } catch (error) {
        console.error("Error in monitoring:", error);
      }
    }, 60000); // Каждую минуту
  }

  // Функция для автоматического завершения "зависших" игр
  function checkAndEndStaleGames() {
    setInterval(async () => {
      try {
        const staleTimeLimit = 30 * 60 * 1000; // 30 минут неактивности
        const now = Date.now();

        const staleGames = await Room.find({
          isCompleted: false,
          isJoin: false,
          lastActivity: { $lt: new Date(now - staleTimeLimit) },
        });

        for (const room of staleGames) {
          room.isCompleted = true;
          room.completedAt = new Date();
          room.isStaleGame = true;

          await room.save();

          io.to(room._id.toString()).emit("game_auto_ended", {
            room,
            reason: "inactivity",
          });
        }
      } catch (error) {
        console.error("Error checking stale games:", error);
      }
    }, 5 * 60 * 1000); // Проверка каждые 5 минут
  }

  // Функция для очистки неактивных игроков
  function clearInactivePlayersScheduler() {
    setInterval(async () => {
      try {
        const inactiveTimeLimit = 5 * 60 * 1000; // 5 минут неактивности
        const now = Date.now();

        const rooms = await Room.find({
          "players.isConnected": false,
          "players.lastDisconnectTime": {
            $lt: new Date(now - inactiveTimeLimit),
          },
        });

        for (const room of rooms) {
          let hasChanges = false;

          room.players = room.players.filter((p) => {
            const shouldKeep =
              p.isConnected ||
              !p.lastDisconnectTime ||
              now - p.lastDisconnectTime.getTime() <= inactiveTimeLimit;
            if (!shouldKeep) hasChanges = true;
            return shouldKeep;
          });

          if (hasChanges) {
            await room.save();
            io.to(room._id.toString()).emit("updateRoom", {
              room: room,
              version: room.version || 0,
              serverTime: Date.now(),
            });
          }
        }
      } catch (error) {
        console.error("Error clearing inactive players:", error);
      }
    }, 60000); // Проверка каждую минуту
  }

  io.on("connection", (socket) => {
    console.log("Connected client:", socket.id);

    // Событие регистрации клиента с информацией о платформе
    socket.on("register_client", ({ platform, deviceInfo }) => {
      socket.platform = platform;
      socket.deviceInfo = deviceInfo;
      console.log(`Client registered - Platform: ${platform}`);
    });

    // Запрос времени сервера для синхронизации
    socket.on("request_server_time", () => {
      socket.emit("server_time", { timestamp: Date.now() });
    });

    // Создание новой комнаты
    socket.on("createRoom", async ({ nickname, response }) => {
      try {
        const data = JSON.parse(response);
        let room = new Room();

        let player = {
          socketID: socket.id,
          nickname,
          playerType: "X",
          correctAnswer: 0, // Используем Number вместо String
          isConnected: true,
          lastActivityTime: new Date(),
          platform: socket.platform,
          deviceInfo: socket.deviceInfo,
        };

        room.players.push(player);
        room.questions = data.questions;
        room.time = data.time;
        room.createdAt = new Date();
        room.lastActivity = new Date();

        room = await room.save();
        const roomId = room._id.toString();
        socket.join(roomId);

        // Запускаем периодическую синхронизацию для этой комнаты
        scheduleRoomStateSync(roomId);

        var roomData = [{ room, playerId: socket.id }];
        io.to(roomId).emit("createRoomSuccess", roomData);
        console.log(`Room created: ${roomId} by ${nickname}`);
      } catch (error) {
        console.error("Error creating room:", error);
        socket.emit("error_occurred", {
          actionType: "createRoom",
          errorMessage: error.message,
          errorCode: "CREATE_ROOM_ERROR",
        });
      }
    });

    // Запрос на обновление состояния комнаты
    socket.on("requestRoomState", async ({ roomId }) => {
      try {
        if (!roomId.match(/^[0-9a-fA-F]{24}$/)) {
          socket.emit("error_occurred", {
            actionType: "requestRoomState",
            errorMessage: "Invalid room ID format",
            errorCode: "INVALID_ROOM_ID",
          });
          return;
        }

        let room = await Room.findById(roomId);
        if (!room) {
          socket.emit("error_occurred", {
            actionType: "requestRoomState",
            errorMessage: "Room not found",
            errorCode: "ROOM_NOT_FOUND",
          });
          return;
        }

        // Проверяем, есть ли игрок с таким socketID в комнате
        let player = room.players.find((p) => p.socketID === socket.id);

        if (!player) {
          // Если игрок не найден, но ID комнаты правильный,
          // возможно это переподключение с новым socketID
          socket.emit("error_occurred", {
            actionType: "requestRoomState",
            errorMessage: "You are not in this room",
            errorCode: "NOT_IN_ROOM",
          });
          return;
        }

        // Обновляем состояние игрока
        player.isConnected = true;
        player.lastActivityTime = new Date();
        await room.save();

        // Отправляем обновленное состояние комнаты игроку
        var roomData = [{ room, playerId: socket.id, player }];
        socket.emit("roomState", roomData);
        console.log(`Room state sent to player ${player.nickname}`);
      } catch (error) {
        console.error("Error requesting room state:", error);
        socket.emit("error_occurred", {
          actionType: "requestRoomState",
          errorMessage: error.message,
          errorCode: "REQUEST_STATE_ERROR",
        });
      }
    });

    // Попытка переподключения к комнате
    socket.on("reconnect_attempt", async ({ roomId, playerId }) => {
      try {
        if (!roomId.match(/^[0-9a-fA-F]{24}$/)) {
          socket.emit("error_occurred", {
            actionType: "reconnect",
            errorMessage: "Invalid room ID format",
            errorCode: "INVALID_ROOM_ID",
          });
          return;
        }

        const room = await Room.findById(roomId);
        if (!room) {
          socket.emit("error_occurred", {
            actionType: "reconnect",
            errorMessage: "Room not found",
            errorCode: "ROOM_NOT_FOUND",
          });
          return;
        }

        // Ищем игрока по старому playerId
        let player = room.players.find((p) => p.socketID === playerId);

        if (player) {
          // Обновляем socketID игрока
          player.socketID = socket.id;
          player.isConnected = true;
          await room.save();

          // Добавляем сокет в комнату
          socket.join(roomId);

          // Отправляем обновленное состояние
          socket.emit("reconnect_success", {
            room,
            player,
            serverTime: Date.now(),
          });

          console.log(
            `Player ${player.nickname} reconnected with new socketID`
          );
        } else {
          socket.emit("error_occurred", {
            actionType: "reconnect",
            errorMessage: "Player not found in this room",
            errorCode: "PLAYER_NOT_FOUND",
          });
        }
      } catch (error) {
        console.error("Error reconnecting:", error);
        socket.emit("error_occurred", {
          actionType: "reconnect",
          errorMessage: error.message,
          errorCode: "RECONNECT_ERROR",
        });
      }
    });

    // Присоединение к существующей комнате
    socket.on("joinRoom", async ({ nickname, roomId }) => {
      await withRoomLock(roomId, async () => {
        try {
          if (!roomId.match(/^[0-9a-fA-F]{24}$/)) {
            socket.emit("error_occurred", {
              actionType: "joinRoom",
              errorMessage: "Invalid room ID format",
              errorCode: "INVALID_ROOM_ID",
            });
            return;
          }

          let room = await Room.findById(roomId);
          if (!room) {
            socket.emit("error_occurred", {
              actionType: "joinRoom",
              errorMessage: "Room not found",
              errorCode: "ROOM_NOT_FOUND",
            });
            return;
          }

          if (room.isJoin) {
            // Проверка на наличие игрока с тем же socketID
            let existingPlayer = room.players.find(
              (player) => player.socketID === socket.id
            );

            if (existingPlayer) {
              socket.emit("error_occurred", {
                actionType: "joinRoom",
                errorMessage:
                  "Player with this socketID already exists in the room",
                errorCode: "DUPLICATE_PLAYER",
              });
              return;
            }

            let player = {
              nickname,
              socketID: socket.id,
              playerType: "O",
              correctAnswer: 0, // Используем Number вместо String
              points: 0,
              isConnected: true,
              lastActivityTime: new Date(),
              platform: socket.platform,
              deviceInfo: socket.deviceInfo,
            };

            socket.join(roomId);
            room.players.push(player);
            room.lastActivity = new Date();

            room = await room.save();

            // Запускаем или обновляем периодическую синхронизацию для этой комнаты
            scheduleRoomStateSync(roomId);

            // Отправка обновленного игрока и socketID клиенту
            var roomData = [{ room, playerId: socket.id }];
            io.to(socket.id).emit("joinRoomSuccess", roomData);

            // Обновляем всех остальных участников
            await updateRoomState(roomId);

            console.log(`Player ${nickname} joined room ${roomId}`);
          } else {
            socket.emit("error_occurred", {
              actionType: "joinRoom",
              errorMessage: "Game already started, you cannot join",
              errorCode: "GAME_ALREADY_STARTED",
            });
          }
        } catch (error) {
          console.error("Error joining room:", error);
          socket.emit("error_occurred", {
            actionType: "joinRoom",
            errorMessage: error.message,
            errorCode: "JOIN_ROOM_ERROR",
          });
        }
      });
    });

    // Запуск игры
    socket.on("startGame", async ({ roomId }) => {
      await withRoomLock(roomId, async () => {
        try {
          if (!roomId.match(/^[0-9a-fA-F]{24}$/)) {
            socket.emit("error_occurred", {
              actionType: "startGame",
              errorMessage: "Invalid room ID format",
              errorCode: "INVALID_ROOM_ID",
            });
            return;
          }

          let room = await Room.findById(roomId);
          if (!room) {
            socket.emit("error_occurred", {
              actionType: "startGame",
              errorMessage: "Room not found",
              errorCode: "ROOM_NOT_FOUND",
            });
            return;
          }

          // Блокируем присоединение новых игроков
          room.isJoin = false;

          // Настройка временных меток для каждого вопроса
          const now = Date.now();
          room.gameStartTime = now + 3000; // Начало через 3 секунды

          room.questionStartTimes = [];
          room.currentQuestion = 0;

          let cumulativeTime = 3000; // Начинаем с 3 секунд для подготовки
          room.questions.forEach((q, index) => {
            const questionTime = parseInt(q.time) * 1000;
            const transitionTime = 3000; // 3 секунды между вопросами

            room.questionStartTimes[index] = now + cumulativeTime;
            cumulativeTime += questionTime + transitionTime;
          });

          // Устанавливаем время окончания первого вопроса
          const firstQuestionTime = parseInt(room.questions[0].time) * 1000;
          room.questionEndTime = room.questionStartTimes[0] + firstQuestionTime;

          room.lastActivity = new Date();
          room = await room.save();

          // Отправляем сигнал о начале игры с точным временем
          io.to(roomId).emit("game_starting", {
            room,
            serverTime: Date.now(),
            startTime: room.gameStartTime,
          });

          console.log(`Game started in room ${roomId}`);

          // Обновляем всех участников
          await updateRoomState(roomId);
        } catch (error) {
          console.error("Error starting game:", error);
          socket.emit("error_occurred", {
            actionType: "startGame",
            errorMessage: error.message,
            errorCode: "START_GAME_ERROR",
          });
        }
      });
    });

    // Обработка ответа игрока
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
        requestId,
        questionIndex,
      }) => {
        await withRoomLock(roomId, async () => {
          try {
            // Валидация входных данных
            if (
              !roomId ||
              !playerId ||
              !requestId ||
              questionIndex === undefined
            ) {
              socket.emit("error_occurred", {
                actionType: "tap",
                errorMessage: "Missing required fields",
                errorCode: "VALIDATION_ERROR",
              });
              return;
            }

            let room = await Room.findById(roomId);

            let player = room.players.find(
              (player) => player.socketID === playerId
            );

            // Обозначаем, что игрок ответил
            player.hasAnswered = true;

            // Добавляем результат
            player.result.push({
              question: question,
              answer: answer,
              correct: correct,
              correctAnswer: correctAnswer,
            });

            // Обновляем очки, если ответ правильный
            if (correct) {
              player.points = Math.round(player.points + points);
              console.log(player.points);
              player.correctAnswer += 1;
            }

            // Обновляем время последней активности
            player.lastActivityTime = new Date();
            room.lastActivity = new Date();

            // Сохраняем изменения
            await room.save();

            // Обновляем всех участников
            await updateRoomState(roomId);

            console.log(
              `Player ${player.nickname} answered question ${questionIndex}, correct: ${correct}`
            );
          } catch (error) {
            console.error("Error processing answer:", error);
            socket.emit("error_occurred", {
              actionType: "tap",
              errorMessage: error.message,
              errorCode: "PROCESS_ANSWER_ERROR",
            });
          }
        });
      }
    );

    // Запрос на проверку ответов игроков
    socket.on("hasAnswers", async ({ roomId }) => {
      try {
        let room = await Room.findById(roomId);
        if (!room) {
          socket.emit("error_occurred", {
            actionType: "hasAnswers",
            errorMessage: "Room not found",
            errorCode: "ROOM_NOT_FOUND",
          });
          return;
        }

        room.lastActivity = new Date();
        await room.save();

        // Обновляем всех участников
        await updateRoomState(roomId);
      } catch (error) {
        console.error("Error checking answers:", error);
        socket.emit("error_occurred", {
          actionType: "hasAnswers",
          errorMessage: error.message,
          errorCode: "CHECK_ANSWERS_ERROR",
        });
      }
    });

    // Завершение игры
    socket.on("end", async ({ roomId, endGame, playerId }) => {
      await withRoomLock(roomId, async () => {
        try {
          let room = await Room.findById(roomId);
          if (!room) {
            socket.emit("error_occurred", {
              actionType: "end",
              errorMessage: "Room not found",
              errorCode: "ROOM_NOT_FOUND",
            });
            return;
          }

          room.isCompleted = true;
          room.completedAt = new Date();

          const endGameData = {
            endGame: endGame,
            playerId: playerId,
            room: room,
            serverTime: Date.now(),
          };

          await room.save();

          // Останавливаем периодическую синхронизацию
          if (roomSyncIntervals[roomId]) {
            clearInterval(roomSyncIntervals[roomId]);
            delete roomSyncIntervals[roomId];
          }

          // Отправляем результат всем участникам
          io.to(roomId).emit("endGame", endGameData);

          console.log(`Game ended in room ${roomId}`);
        } catch (error) {
          console.error("Error ending game:", error);
          socket.emit("error_occurred", {
            actionType: "end",
            errorMessage: error.message,
            errorCode: "END_GAME_ERROR",
          });
        }
      });
    });

    // Обработка отключения игрока
    socket.on("disconnect", async () => {
      try {
        // Находим все комнаты с этим игроком
        const rooms = await Room.find({
          "players.socketID": socket.id,
        });

        for (const room of rooms) {
          const roomId = room._id.toString();

          // Пометить игрока как отключенного, но не удалять
          const player = room.players.find((p) => p.socketID === socket.id);
          if (player) {
            player.isConnected = false;
            player.lastDisconnectTime = new Date();
            await room.save();

            // Сообщить остальным игрокам
            io.to(roomId).emit("player_disconnected", {
              playerId: socket.id,
              room: room,
            });

            console.log(
              `Player ${player.nickname} disconnected from room ${roomId}`
            );
          }
        }
      } catch (error) {
        console.error("Error handling disconnect:", error);
      }
    });

    // Подтверждение получения действия
    socket.on("action_ack", ({ actionId, roomId, playerId }) => {
      console.log(
        `Action ${actionId} acknowledged by player ${playerId} in room ${roomId}`
      );
    });
  });
};
