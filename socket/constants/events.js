// Константы событий сокет-соединений

// Общие события
export const CONNECTION = 'connection';
export const DISCONNECT = 'disconnect';
export const ERROR = 'error_occurred';

// События от клиента
export const REGISTER_CLIENT = 'register_client';
export const REQUEST_SERVER_TIME = 'request_server_time';
export const CREATE_ROOM = 'createRoom';
export const JOIN_ROOM = 'joinRoom';
export const START_GAME = 'startGame';
export const TAP = 'tap';
export const REQUEST_ROOM_STATE = 'requestRoomState';
export const RECONNECT_ATTEMPT = 'reconnect_attempt';

// События к клиенту
export const SERVER_TIME = 'server_time';
export const CREATE_ROOM_SUCCESS = 'createRoomSuccess';
export const JOIN_ROOM_SUCCESS = 'joinRoomSuccess';
export const ROOM_STATE = 'roomState';
export const UPDATE_ROOM = 'updateRoom';
export const GAME_STARTING = 'game_starting';
export const GAME_AUTO_ENDED = 'game_auto_ended';
export const RECONNECT_SUCCESS = 'reconnect_success';
export const NEXT_QUESTION = 'next_question';
export const GAME_COMPLETED = 'game_completed';

// Коды ошибок
export const ERROR_CODES = {
  INVALID_ROOM_ID: 'INVALID_ROOM_ID',
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  PLAYER_NOT_FOUND: 'PLAYER_NOT_FOUND',
  CREATE_ROOM_ERROR: 'CREATE_ROOM_ERROR',
  JOIN_ROOM_ERROR: 'JOIN_ROOM_ERROR',
  START_GAME_ERROR: 'START_GAME_ERROR',
  RECONNECT_ERROR: 'RECONNECT_ERROR',
  REQUEST_STATE_ERROR: 'REQUEST_STATE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_PLAYER: 'DUPLICATE_PLAYER',
  GAME_ALREADY_STARTED: 'GAME_ALREADY_STARTED',
}; 