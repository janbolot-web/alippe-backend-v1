/**
 * Конфигурация для сокет-сервера
 */

export default {
  // Основные настройки
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  
  // Параметры переподключения
  reconnection: {
    maxAttempts: 5,
    timeout: 10000, // 10 секунд
    delay: 1000 // Начальная задержка 1 секунда
  },
  
  // Тайм-ауты
  timeouts: {
    connectionTimeout: 45000, // 45 секунд
    pingTimeout: 30000, // 30 секунд
    pingInterval: 25000 // 25 секунд
  },
  
  // Лимиты мониторинга
  monitoring: {
    staleGameTimeout: 30 * 60 * 1000, // 30 минут неактивности для игры
    inactivePlayerTimeout: 5 * 60 * 1000, // 5 минут неактивности для игрока
    monitoringInterval: 60000, // Интервал мониторинга - 1 минута
    staleGameCheckInterval: 5 * 60 * 1000, // Проверка зависших игр - 5 минут
    playerCleanupInterval: 60000 // Очистка неактивных игроков - 1 минута
  },
  
  // Игровые настройки
  game: {
    transitionTime: 3000, // 3 секунды между вопросами
    gameStartDelay: 3000 // 3 секунды задержка перед началом игры
  }
}; 