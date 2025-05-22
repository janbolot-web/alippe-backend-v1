import Room from '../../models/room.js';

// Объект для хранения блокировок комнат для предотвращения race condition
const roomLocks = {};
// Объект для хранения интервалов синхронизации по комнатам
const roomSyncIntervals = {};

/**
 * Функция для безопасного выполнения операций с блокировкой комнаты
 * @param {string} roomId - ID комнаты
 * @param {Function} callback - функция, которая будет выполнена с блокировкой
 */
export async function withRoomLock(roomId, callback) {
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

/**
 * Обновление состояния комнаты и отправка всем участникам
 * @param {string} roomId - ID комнаты
 * @param {object} io - экземпляр Socket.io
 */
export async function updateRoomState(roomId, io) {
  try {
    let room = await Room.findById(roomId);
    if (room) {
      // Обновляем время последней активности
      room.lastActivity = new Date();
      // Увеличиваем номер версии при каждом обновлении
      room.version = (room.version || 0) + 1;
      await room.save();

      // Отправляем всем участникам обновленную информацию о комнате
      io.to(roomId).emit('updateRoom', {
        room: room,
        version: room.version || 0,
        serverTime: Date.now(),
      });
    }
  } catch (error) {
    console.log('Error updating room state:', error);
  }
}

/**
 * Функция для периодической проверки состояния комнаты
 * @param {string} roomId - ID комнаты
 * @param {object} io - экземпляр Socket.io
 * @param {number} interval - интервал синхронизации в мс
 */
export function scheduleRoomStateSync(roomId, io, interval = 5000) {
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

      io.to(roomId).emit('updateRoom', {
        room: room,
        version: room.version || 0,
        serverTime: Date.now(),
      });
    } catch (error) {
      console.log('Error in sync interval:', error);
      clearInterval(syncInterval);
      delete roomSyncIntervals[roomId];
    }
  }, interval);

  // Сохраняем интервал, чтобы можно было его очистить при необходимости
  roomSyncIntervals[roomId] = syncInterval;
}

/**
 * Проверка на валидный ID комнаты (MongoDB ObjectId)
 * @param {string} roomId - ID комнаты
 * @returns {boolean} - результат проверки
 */
export function isValidRoomId(roomId) {
  return roomId && roomId.match(/^[0-9a-fA-F]{24}$/);
}

/**
 * Получение комнаты по ID с дополнительной проверкой
 * @param {string} roomId - ID комнаты
 * @returns {Promise<object|null>} - объект комнаты или null
 */
export async function getRoomById(roomId) {
  if (!isValidRoomId(roomId)) {
    return null;
  }
  return await Room.findById(roomId);
}

/**
 * Очистка ресурсов, связанных с комнатой
 * @param {string} roomId - ID комнаты
 */
export function cleanupRoom(roomId) {
  if (roomSyncIntervals[roomId]) {
    clearInterval(roomSyncIntervals[roomId]);
    delete roomSyncIntervals[roomId];
  }
  
  if (roomLocks[roomId]) {
    roomLocks[roomId] = false;
  }
} 