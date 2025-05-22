import Room from '../../models/room.js';
import { 
  withRoomLock, 
  updateRoomState,
  isValidRoomId 
} from '../utils/roomUtils.js';
import * as Events from '../constants/events.js';

/**
 * Обработчик ответа игрока на вопрос
 * @param {object} socket - экземпляр сокет-соединения
 * @param {object} io - экземпляр Socket.io
 */
export function handleTap(socket, io) {
  socket.on(
    Events.TAP,
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
            socket.emit(Events.ERROR, {
              actionType: 'tap',
              errorMessage: 'Missing required fields',
              errorCode: Events.ERROR_CODES.VALIDATION_ERROR,
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
            player.correctAnswer += 1;
          }

          // Обновляем время последней активности
          player.lastActivityTime = new Date();
          room.lastActivity = new Date();

          // Сохраняем и отправляем подтверждение обработки ответа
          await room.save();
          socket.emit('tap_processed', {
            requestId,
            questionIndex,
            points: player.points,
          });

          // Обновляем всех участников
          await updateRoomState(roomId, io);
        } catch (error) {
          console.error('Error processing tap:', error);
          socket.emit(Events.ERROR, {
            actionType: 'tap',
            errorMessage: error.message,
            errorCode: 'TAP_ERROR',
          });
        }
      });
    }
  );
}

/**
 * Обработчик для следующего вопроса
 * @param {object} socket - экземпляр сокет-соединения
 * @param {object} io - экземпляр Socket.io
 */
export function handleNextQuestion(socket, io) {
  socket.on('next_question', async ({ roomId, questionIndex }) => {
    await withRoomLock(roomId, async () => {
      try {
        if (!isValidRoomId(roomId)) {
          socket.emit(Events.ERROR, {
            actionType: 'next_question',
            errorMessage: 'Invalid room ID format',
            errorCode: Events.ERROR_CODES.INVALID_ROOM_ID,
          });
          return;
        }

        let room = await Room.findById(roomId);
        if (!room) {
          socket.emit(Events.ERROR, {
            actionType: 'next_question',
            errorMessage: 'Room not found',
            errorCode: Events.ERROR_CODES.ROOM_NOT_FOUND,
          });
          return;
        }

        // Проверяем, что запрос корректный
        if (questionIndex < 0 || questionIndex >= room.questions.length || questionIndex !== room.currentQuestion) {
          socket.emit(Events.ERROR, {
            actionType: 'next_question',
            errorMessage: 'Invalid question index',
            errorCode: 'INVALID_QUESTION_INDEX',
          });
          return;
        }

        // Обновляем текущий вопрос
        room.currentQuestion += 1;
        
        // Обновляем время последней активности и сохраняем
        room.lastActivity = new Date();
        
        // Если вопросы закончились, завершаем игру
        if (room.currentQuestion >= room.questions.length) {
          room.isCompleted = true;
          room.completedAt = new Date();
          await room.save();
          
          io.to(roomId).emit(Events.GAME_COMPLETED, {
            room,
            serverTime: Date.now(),
          });
          
          console.log(`Game completed in room ${roomId}`);
        } else {
          // Иначе переходим к следующему вопросу
          // Устанавливаем время окончания следующего вопроса
          const nextQuestionTime = parseInt(room.questions[room.currentQuestion].time) * 1000;
          room.questionEndTime = room.questionStartTimes[room.currentQuestion] + nextQuestionTime;
          
          await room.save();
          
          // Отправляем информацию о следующем вопросе
          io.to(roomId).emit(Events.NEXT_QUESTION, {
            room,
            currentQuestion: room.currentQuestion,
            questionStartTime: room.questionStartTimes[room.currentQuestion],
            questionEndTime: room.questionEndTime,
            serverTime: Date.now(),
          });
          
          console.log(`Moving to question ${room.currentQuestion} in room ${roomId}`);
        }
        
        // Обновляем всех участников
        await updateRoomState(roomId, io);
      } catch (error) {
        console.error('Error processing next question:', error);
        socket.emit(Events.ERROR, {
          actionType: 'next_question',
          errorMessage: error.message,
          errorCode: 'NEXT_QUESTION_ERROR',
        });
      }
    });
  });
}

/**
 * Обработчик отключения пользователя
 * @param {object} socket - экземпляр сокет-соединения
 * @param {object} io - экземпляр Socket.io
 */
export function handleDisconnect(socket, io) {
  socket.on(Events.DISCONNECT, async () => {
    try {
      // Поиск всех комнат, где игрок является участником
      const rooms = await Room.find({
        'players.socketID': socket.id,
      });

      const now = new Date();
      
      for (const room of rooms) {
        // Находим игрока в комнате
        const player = room.players.find(p => p.socketID === socket.id);
        
        if (player) {
          // Устанавливаем статус отключения
          player.isConnected = false;
          player.lastDisconnectTime = now;
          
          console.log(`Player ${player.nickname} disconnected from room ${room._id}`);
          
          await room.save();
          
          // Отправляем обновление всем остальным участникам
          await updateRoomState(room._id.toString(), io);
        }
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
}

/**
 * Обработчик для запроса серверного времени
 * @param {object} socket - экземпляр сокет-соединения
 */
export function handleRequestServerTime(socket) {
  socket.on(Events.REQUEST_SERVER_TIME, () => {
    socket.emit(Events.SERVER_TIME, { timestamp: Date.now() });
  });
}

/**
 * Обработчик для регистрации клиента
 * @param {object} socket - экземпляр сокет-соединения
 */
export function handleRegisterClient(socket) {
  socket.on(Events.REGISTER_CLIENT, ({ platform, deviceInfo }) => {
    socket.platform = platform;
    socket.deviceInfo = deviceInfo;
    console.log(`Client registered - Platform: ${platform}`);
  });
} 