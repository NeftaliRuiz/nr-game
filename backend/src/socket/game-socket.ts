import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';

/**
 * Game Socket Handler
 * Manages real-time WebSocket connections for Kahoot and Geoparty game modes
 */

interface GameRoom {
  gameId: string;
  mode: 'KAHOOT' | 'GEOPARTY' | 'WORDSEARCH';
  participants: Set<string>;
  currentQuestion?: any;
  timer?: NodeJS.Timeout;
}

// Store active game rooms
const gameRooms = new Map<string, GameRoom>();

// Store socket to participant mapping
const socketToParticipant = new Map<string, { gameId: string; participantId: string; userName: string }>();

/**
 * Initialize Socket.IO server
 */
export function initializeGameSocket(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*', // In production, restrict to specific origins
      methods: ['GET', 'POST'],
    },
    path: '/socket.io',
  });

  // Create /game namespace
  const gameNamespace = io.of('/game');

  // expose a small helper to allow controllers to emit events into a game room
  (initializeGameSocket as any).gameNamespace = gameNamespace;

  gameNamespace.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // ==================== GAME JOIN ====================
    /**
     * Join a game room
     * @event join-game
     * @payload { gameId: string, participantId: string, userName: string, mode: 'KAHOOT' | 'GEOPARTY' }
     */
    socket.on('join-game', ({ gameId, participantId, userName, mode }) => {
      console.log(`👤 ${userName} joining game ${gameId} (${mode})`);

      // Leave previous game room if any
      const previousData = socketToParticipant.get(socket.id);
      if (previousData) {
        socket.leave(previousData.gameId);
        const previousRoom = gameRooms.get(previousData.gameId);
        if (previousRoom) {
          previousRoom.participants.delete(socket.id);
        }
      }

      // Join new game room
      socket.join(gameId);
      socketToParticipant.set(socket.id, { gameId, participantId, userName });

      // Create or update game room
      if (!gameRooms.has(gameId)) {
        gameRooms.set(gameId, {
          gameId,
          mode,
          participants: new Set([socket.id]),
        });
      } else {
        gameRooms.get(gameId)!.participants.add(socket.id);
      }

      const room = gameRooms.get(gameId)!;

      // Notify all participants in room
      gameNamespace.to(gameId).emit('participant-joined', {
        participantId,
        userName,
        totalParticipants: room.participants.size,
      });

      // Send current game state to new participant
      if (room.currentQuestion) {
        socket.emit('current-question', room.currentQuestion);
      }

      console.log(`✅ ${userName} joined. Total participants: ${room.participants.size}`);
    });

    // ==================== GAME START ====================
    /**
     * Start the game (admin only)
     * @event start-game
     * @payload { gameId: string }
     */
    socket.on('start-game', ({ gameId }) => {
      console.log(`🎮 Starting game ${gameId}`);
      
      gameNamespace.to(gameId).emit('game-started', {
        message: 'Game has started!',
        timestamp: new Date().toISOString(),
      });
    });

    // ==================== QUESTION EVENTS ====================
    /**
     * Load new question
     * @event question-changed
     * @payload { gameId: string, question: any }
     */
    socket.on('question-changed', ({ gameId, question }) => {
      console.log(`❓ New question for game ${gameId}: ${question.question}`);

      const room = gameRooms.get(gameId);
      if (room) {
        room.currentQuestion = question;
      }

      // Broadcast to all participants
      gameNamespace.to(gameId).emit('question-changed', {
        question: {
          id: question.id,
          category: question.category,
          difficulty: question.difficulty,
          question: question.question,
          options: question.options,
          timeLimit: question.timeLimit,
          points: question.points,
        },
        timestamp: new Date().toISOString(),
      });
    });

    /**
     * Start question timer
     * @event start-timer
     * @payload { gameId: string, timeLimit: number }
     */
    socket.on('start-timer', ({ gameId, timeLimit }) => {
      console.log(`⏱️ Starting timer for game ${gameId}: ${timeLimit}s`);

      const room = gameRooms.get(gameId);
      if (!room) return;

      // Clear existing timer
      if (room.timer) {
        clearInterval(room.timer);
      }

      let timeRemaining = timeLimit;

      // Emit timer tick every second
      room.timer = setInterval(() => {
        timeRemaining--;
        
        gameNamespace.to(gameId).emit('timer-tick', {
          timeRemaining,
          timeLimit,
        });

        // Timer expired
        if (timeRemaining <= 0) {
          clearInterval(room.timer!);
          gameNamespace.to(gameId).emit('timer-expired', {
            message: 'Time is up!',
          });
        }
      }, 1000);
    });

    /**
     * Stop question timer
     * @event stop-timer
     * @payload { gameId: string }
     */
    socket.on('stop-timer', ({ gameId }) => {
      console.log(`⏹️ Stopping timer for game ${gameId}`);

      const room = gameRooms.get(gameId);
      if (room && room.timer) {
        clearInterval(room.timer);
        room.timer = undefined;
      }
    });

    // ==================== ANSWER EVENTS ====================
    /**
     * Submit answer
     * @event submit-answer
     * @payload { gameId: string, participantId: string, questionId: string, selectedAnswer: number }
     */
    socket.on('submit-answer', ({ gameId, participantId, questionId, selectedAnswer }) => {
      const participant = socketToParticipant.get(socket.id);
      if (!participant) return;

      console.log(`✍️ ${participant.userName} submitted answer for question ${questionId}`);

      // Broadcast to all participants (excluding sender)
      socket.to(gameId).emit('answer-submitted', {
        participantId,
        userName: participant.userName,
        questionId,
        timestamp: new Date().toISOString(),
      });
    });

    /**
     * Answer result (sent from backend after validation)
     * @event answer-result
     * @payload { gameId: string, participantId: string, isCorrect: boolean, points: number, correctAnswer: number }
     */
    socket.on('answer-result', ({ gameId, participantId, isCorrect, points, correctAnswer }) => {
      const participant = socketToParticipant.get(socket.id);
      if (!participant) return;

      console.log(`${isCorrect ? '✅' : '❌'} ${participant.userName} - ${isCorrect ? 'Correct!' : 'Wrong'} (+${points} points)`);

      // Broadcast result to all participants
      gameNamespace.to(gameId).emit('answer-result', {
        participantId,
        userName: participant.userName,
        isCorrect,
        points,
        correctAnswer,
      });
    });

    // ==================== LEADERBOARD EVENTS ====================
    /**
     * Update leaderboard
     * @event leaderboard-updated
     * @payload { gameId: string, leaderboard: any[] }
     */
    socket.on('leaderboard-updated', ({ gameId, leaderboard }) => {
      console.log(`🏆 Leaderboard updated for game ${gameId}`);

      gameNamespace.to(gameId).emit('leaderboard-updated', {
        leaderboard,
        timestamp: new Date().toISOString(),
      });
    });

    // ==================== GAME END ====================
    /**
     * End the game
     * @event end-game
     * @payload { gameId: string, finalLeaderboard: any[] }
     */
    socket.on('end-game', ({ gameId, finalLeaderboard }) => {
      console.log(`🏁 Game ${gameId} ended`);

      const room = gameRooms.get(gameId);
      if (room && room.timer) {
        clearInterval(room.timer);
      }

      gameNamespace.to(gameId).emit('game-ended', {
        message: 'Game has ended!',
        finalLeaderboard,
        timestamp: new Date().toISOString(),
      });
    });

    // ==================== CHAT (Optional) ====================
    /**
     * Send chat message
     * @event chat-message
     * @payload { gameId: string, message: string }
     */
    socket.on('chat-message', ({ gameId, message }) => {
      const participant = socketToParticipant.get(socket.id);
      if (!participant) return;

      console.log(`💬 ${participant.userName}: ${message}`);

      gameNamespace.to(gameId).emit('chat-message', {
        userName: participant.userName,
        participantId: participant.participantId,
        message,
        timestamp: new Date().toISOString(),
      });
    });

    // ==================== WORD SEARCH ROOM MANAGEMENT ====================
    /**
     * Join a room by room code (for Word Search and other games)
     * @event join-room
     * @payload { roomCode: string }
     */
    socket.on('join-room', ({ roomCode }) => {
      console.log(`🔍 Socket ${socket.id} joining room ${roomCode}`);
      socket.join(roomCode);
      
      // Count participants in room
      const room = gameNamespace.adapter.rooms.get(roomCode);
      const participantCount = room ? room.size : 1;
      
      console.log(`✅ Socket joined room ${roomCode}. Total: ${participantCount}`);
    });

    /**
     * Leave a room
     * @event leave-room
     * @payload { roomCode: string }
     */
    socket.on('leave-room', ({ roomCode }) => {
      console.log(`👋 Socket ${socket.id} leaving room ${roomCode}`);
      socket.leave(roomCode);
    });

    // ==================== DISCONNECT ====================
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);

      const participant = socketToParticipant.get(socket.id);
      if (participant) {
        const room = gameRooms.get(participant.gameId);
        if (room) {
          room.participants.delete(socket.id);

          // Notify remaining participants
          gameNamespace.to(participant.gameId).emit('participant-left', {
            participantId: participant.participantId,
            userName: participant.userName,
            totalParticipants: room.participants.size,
          });

          console.log(`👋 ${participant.userName} left. Remaining: ${room.participants.size}`);

          // Clean up empty rooms
          if (room.participants.size === 0) {
            if (room.timer) {
              clearInterval(room.timer);
            }
            gameRooms.delete(participant.gameId);
            console.log(`🗑️ Empty room ${participant.gameId} deleted`);
          }
        }

        socketToParticipant.delete(socket.id);
      }
    });
  });

  console.log('🎮 Game Socket.IO initialized on /game namespace');
  return io;
}

/**
 * Emit an event to a game room from server-side controllers
 * @param gameIdOrRoomCode - Can be gameId (UUID) or roomCode (6-char code for Word Search)
 */
export function emitToGame(gameIdOrRoomCode: string, event: string, payload: any) {
  try {
    const ns = (initializeGameSocket as any).gameNamespace;
    if (ns) {
      ns.to(gameIdOrRoomCode).emit(event, payload);
      console.log(`📡 Emitted ${event} to room ${gameIdOrRoomCode}`);
    }
  } catch (err) {
    console.warn('emitToGame failed', err);
  }
}

/**
 * Get active game rooms (for monitoring)
 */
export function getActiveGameRooms() {
  return Array.from(gameRooms.entries()).map(([gameId, room]) => ({
    gameId,
    mode: room.mode,
    participants: room.participants.size,
    hasCurrentQuestion: !!room.currentQuestion,
    hasActiveTimer: !!room.timer,
  }));
}
