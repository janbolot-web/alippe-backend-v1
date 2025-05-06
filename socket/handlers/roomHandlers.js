import { v4 as uuidv4 } from 'uuid';
import Room from '../../models/room.js';
import { 
  withRoomLock, 
  updateRoomState, 
  scheduleRoomStateSync, 
  isValidRoomId 
} from '../utils/roomUtils.js';
import * as Events from '../constants/events.js';

/**
 * Обработчик создания новой комнаты
 * @param {object} socket - экземпляр сокет-соединения
 * @param {object} io - экземпляр Socket.io
 */
export function handleCreateRoom(socket, io) {
  socket.on(Events.CREATE_ROOM, async ({ nickname, response }) => {
    try {
      const data = JSON.parse(response);
      let room = new Room();

      let player = {
        socketID: socket.id,
        nickname,
        playerType: 'X',
        correctAnswer: 0, 
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
      scheduleRoomStateSync(roomId, io);

      var roomData = [{ room, playerId: socket.id }];
      io.to(roomId).emit(Events.CREATE_ROOM_SUCCESS, roomData);
      console.log(`Room created: ${roomId} by ${nickname}`);
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit(Events.ERROR, {
        actionType: 'createRoom',
        errorMessage: error.message,
        errorCode: Events.ERROR_CODES.CREATE_ROOM_ERROR,
      });
    }
  });
}

/**
 * Обработчик присоединения к существующей комнате
 * @param {object} socket - экземпляр сокет-соединения
 * @param {object} io - экземпляр Socket.io
 */
export function handleJoinRoom(socket, io) {
  socket.on(Events.JOIN_ROOM, async ({ nickname, roomId }) => {
    await withRoomLock(roomId, async () => {
      try {
        if (!isValidRoomId(roomId)) {
          socket.emit(Events.ERROR, {
            actionType: 'joinRoom',
            errorMessage: 'Invalid room ID format',
            errorCode: Events.ERROR_CODES.INVALID_ROOM_ID,
          });
          return;
        }

        let room = await Room.findById(roomId);
        if (!room) {
          socket.emit(Events.ERROR, {
            actionType: 'joinRoom',
            errorMessage: 'Room not found',
            errorCode: Events.ERROR_CODES.ROOM_NOT_FOUND,
          });
          return;
        }

        if (room.isJoin) {
          // Проверка на наличие игрока с тем же socketID
          let existingPlayer = room.players.find(
            (player) => player.socketID === socket.id
          );

          if (existingPlayer) {
            socket.emit(Events.ERROR, {
              actionType: 'joinRoom',
              errorMessage: 'Player with this socketID already exists in the room',
              errorCode: Events.ERROR_CODES.DUPLICATE_PLAYER,
            });
            return;
          }

          let player = {
            nickname,
            socketID: socket.id,
            playerType: 'O',
            correctAnswer: 0,
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
          scheduleRoomStateSync(roomId, io);

          // Отправка обновленного игрока и socketID клиенту
          var roomData = [{ room, playerId: socket.id }];
          io.to(socket.id).emit(Events.JOIN_ROOM_SUCCESS, roomData);

          // Обновляем всех остальных участников
          await updateRoomState(roomId, io);

          console.log(`Player ${nickname} joined room ${roomId}`);
        } else {
          socket.emit(Events.ERROR, {
            actionType: 'joinRoom',
            errorMessage: 'Game already started, you cannot join',
            errorCode: Events.ERROR_CODES.GAME_ALREADY_STARTED,
          });
        }
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit(Events.ERROR, {
          actionType: 'joinRoom',
          errorMessage: error.message,
          errorCode: Events.ERROR_CODES.JOIN_ROOM_ERROR,
        });
      }
    });
  });
}

/**
 * Обработчик запуска игры
 * @param {object} socket - экземпляр сокет-соединения
 * @param {object} io - экземпляр Socket.io
 */
export function handleStartGame(socket, io) {
  socket.on(Events.START_GAME, async ({ roomId }) => {
    await withRoomLock(roomId, async () => {
      try {
        if (!isValidRoomId(roomId)) {
          socket.emit(Events.ERROR, {
            actionType: 'startGame',
            errorMessage: 'Invalid room ID format',
            errorCode: Events.ERROR_CODES.INVALID_ROOM_ID,
          });
          return;
        }

        let room = await Room.findById(roomId);
        if (!room) {
          socket.emit(Events.ERROR, {
            actionType: 'startGame',
            errorMessage: 'Room not found',
            errorCode: Events.ERROR_CODES.ROOM_NOT_FOUND,
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
        io.to(roomId).emit(Events.GAME_STARTING, {
          room,
          serverTime: Date.now(),
          startTime: room.gameStartTime,
        });

        console.log(`Game started in room ${roomId}`);

        // Обновляем всех участников
        await updateRoomState(roomId, io);
      } catch (error) {
        console.error('Error starting game:', error);
        socket.emit(Events.ERROR, {
          actionType: 'startGame',
          errorMessage: error.message,
          errorCode: Events.ERROR_CODES.START_GAME_ERROR,
        });
      }
    });
  });
}

/**
 * Обработчик запроса состояния комнаты
 * @param {object} socket - экземпляр сокет-соединения
 * @param {object} io - экземпляр Socket.io
 */
export function handleRequestRoomState(socket, io) {
  socket.on(Events.REQUEST_ROOM_STATE, async ({ roomId }) => {
    try {
      if (!isValidRoomId(roomId)) {
        socket.emit(Events.ERROR, {
          actionType: 'requestRoomState',
          errorMessage: 'Invalid room ID format',
          errorCode: Events.ERROR_CODES.INVALID_ROOM_ID,
        });
        return;
      }

      let room = await Room.findById(roomId);
      if (!room) {
        socket.emit(Events.ERROR, {
          actionType: 'requestRoomState',
          errorMessage: 'Room not found',
          errorCode: Events.ERROR_CODES.ROOM_NOT_FOUND,
        });
        return;
      }

      // Проверяем, есть ли игрок с таким socketID в комнате
      let player = room.players.find((p) => p.socketID === socket.id);

      if (!player) {
        // Если игрок не найден, но ID комнаты правильный,
        // возможно это переподключение с новым socketID
        socket.emit(Events.ERROR, {
          actionType: 'requestRoomState',
          errorMessage: 'You are not in this room',
          errorCode: Events.ERROR_CODES.NOT_IN_ROOM,
        });
        return;
      }

      // Обновляем состояние игрока
      player.isConnected = true;
      player.lastActivityTime = new Date();
      await room.save();

      // Отправляем обновленное состояние комнаты игроку
      var roomData = [{ room, playerId: socket.id, player }];
      socket.emit(Events.ROOM_STATE, roomData);
      console.log(`Room state sent to player ${player.nickname}`);
    } catch (error) {
      console.error('Error requesting room state:', error);
      socket.emit(Events.ERROR, {
        actionType: 'requestRoomState',
        errorMessage: error.message,
        errorCode: Events.ERROR_CODES.REQUEST_STATE_ERROR,
      });
    }
  });
}

/**
 * Обработчик попытки переподключения
 * @param {object} socket - экземпляр сокет-соединения
 * @param {object} io - экземпляр Socket.io
 */
export function handleReconnectAttempt(socket, io) {
  socket.on(Events.RECONNECT_ATTEMPT, async ({ roomId, playerId }) => {
    try {
      if (!isValidRoomId(roomId)) {
        socket.emit(Events.ERROR, {
          actionType: 'reconnect',
          errorMessage: 'Invalid room ID format',
          errorCode: Events.ERROR_CODES.INVALID_ROOM_ID,
        });
        return;
      }

      const room = await Room.findById(roomId);
      if (!room) {
        socket.emit(Events.ERROR, {
          actionType: 'reconnect',
          errorMessage: 'Room not found',
          errorCode: Events.ERROR_CODES.ROOM_NOT_FOUND,
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
        socket.emit(Events.RECONNECT_SUCCESS, {
          room,
          player,
          serverTime: Date.now(),
        });

        console.log(`Player ${player.nickname} reconnected with new socketID`);
      } else {
        socket.emit(Events.ERROR, {
          actionType: 'reconnect',
          errorMessage: 'Player not found in this room',
          errorCode: Events.ERROR_CODES.PLAYER_NOT_FOUND,
        });
      }
    } catch (error) {
      console.error('Error reconnecting:', error);
      socket.emit(Events.ERROR, {
        actionType: 'reconnect',
        errorMessage: error.message,
        errorCode: Events.ERROR_CODES.RECONNECT_ERROR,
      });
    }
  });
} 