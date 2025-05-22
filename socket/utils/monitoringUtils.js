import Room from '../../models/room.js';

/**
 * Настройка периодического мониторинга активных комнат
 */
export function setupMonitoring() {
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

      // Место для логирования статистики в какую-либо систему мониторинга
      // console.log("Game statistics:", stats);
    } catch (error) {
      console.error("Error in monitoring:", error);
    }
  }, 60000); // Каждую минуту
}

/**
 * Функция для автоматического завершения "зависших" игр
 * @param {object} io - экземпляр Socket.io
 */
export function setupStaleGamesChecker(io) {
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

/**
 * Функция для очистки неактивных игроков
 * @param {object} io - экземпляр Socket.io
 */
export function setupInactivePlayersCleanup(io) {
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