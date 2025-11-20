import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Game, GameStatus } from '../entities/Game';
import { GameParticipant } from '../entities/GameParticipant';

/**
 * Get all active game rooms (waiting or in_progress)
 * GET /api/game/rooms
 */
export async function getActiveGameRooms(req: Request, res: Response): Promise<void> {
  try {
    const gameRepository = AppDataSource.getRepository(Game);
    const participantRepository = AppDataSource.getRepository(GameParticipant);
    // Find games that are waiting or in progress
    const games = await gameRepository.find({
      where: [
        { status: GameStatus.WAITING },
        { status: GameStatus.IN_PROGRESS },
      ],
      relations: ['event', 'participants', 'participants.user'],
      order: {
        createdAt: 'DESC',
      },
    });

    // Format response with participant count
    const rooms = await Promise.all(
      games.map(async (game) => {
        const participantCount = await participantRepository.count({
          where: { gameId: game.id },
        });

        return {
          id: game.id,
          roomCode: game.roomCode,
          name: game.name,
          mode: game.mode,
          status: game.status,
          totalQuestions: game.totalQuestions,
          questionsAnswered: game.usedQuestionIds?.length || 0,
          participants: participantCount,
          eventName: game.event?.name || null,
          createdAt: game.createdAt,
          startedAt: game.startedAt,
        };
      })
    );

    res.json({
      success: true,
      data: {
        rooms,
        total: rooms.length,
      },
    });
  } catch (error) {
    console.error('Get active game rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active game rooms',
    });
  }
}

/**
 * Get game room details by room code
 * GET /api/game/rooms/:roomCode
 */
export async function getGameRoomByCode(req: Request, res: Response): Promise<void> {
  try {
    const gameRepository = AppDataSource.getRepository(Game);
    const participantRepository = AppDataSource.getRepository(GameParticipant);
    const { roomCode } = req.params;

    const game = await gameRepository.findOne({
      where: { roomCode: roomCode.toUpperCase() },
      relations: ['event', 'participants', 'participants.user'],
    });

    if (!game) {
      res.status(404).json({
        success: false,
        message: 'Game room not found',
      });
      return;
    }

    const participantCount = await participantRepository.count({
      where: { gameId: game.id },
    });

    res.json({
      success: true,
      data: {
        room: {
          id: game.id,
          roomCode: game.roomCode,
          name: game.name,
          mode: game.mode,
          status: game.status,
          totalQuestions: game.totalQuestions,
          questionsAnswered: game.usedQuestionIds?.length || 0,
          participants: participantCount,
          participantsList: game.participants.map((p) => ({
            id: p.id,
            userName: p.user?.name || 'Unknown',
            score: p.score,
            correctAnswers: p.correctAnswers,
          })),
          eventName: game.event?.name || null,
          createdAt: game.createdAt,
          startedAt: game.startedAt,
          finishedAt: game.finishedAt,
        },
      },
    });
  } catch (error) {
    console.error('Get game room by code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get game room',
    });
  }
}
