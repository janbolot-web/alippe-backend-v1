import { Server } from 'socket.io';
import { 
  setupMonitoring,
  setupStaleGamesChecker,
  setupInactivePlayersCleanup 
} from './utils/monitoringUtils.js';
import {
  handleCreateRoom,
  handleJoinRoom,
  handleStartGame,
  handleRequestRoomState,
  handleReconnectAttempt
} from './handlers/roomHandlers.js';
import {
  handleTap,
  handleNextQuestion,
  handleDisconnect,
  handleRequestServerTime,
  handleRegisterClient
} from './handlers/gameHandlers.js';

/**
 * Настройка сокет-сервера и инициализация обработчиков
 * @param {object} server - HTTP сервер
 * @returns {object} экземпляр socket.io сервера
 */
export function setupSocket(server) {
  // Инициализация сокет-сервера
  const io = new Server(server);

  // Инициализация мониторинга и проверок
  setupMonitoring();
  setupStaleGamesChecker(io);
  setupInactivePlayersCleanup(io);

  // Обработка подключения нового клиента
  io.on('connection', (socket) => {
    console.log('Connected client:', socket.id);

    // Регистрация обработчиков комнат
    handleCreateRoom(socket, io);
    handleJoinRoom(socket, io);
    handleStartGame(socket, io);
    handleRequestRoomState(socket, io);
    handleReconnectAttempt(socket, io);

    // Регистрация игровых обработчиков
    handleTap(socket, io);
    handleNextQuestion(socket, io);
    handleDisconnect(socket, io);
    handleRequestServerTime(socket);
    handleRegisterClient(socket);
  });

  return io;
}

/**
 * Получить экземпляр io для использования в других частях приложения
 * @param {object} io - экземпляр socket.io сервера
 */
export function getSocketIO(io) {
  return io;
} 