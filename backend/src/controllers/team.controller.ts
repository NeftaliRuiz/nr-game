import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Team } from '../entities/Team';
import { Event } from '../entities/Event';

const teamRepository = AppDataSource.getRepository(Team);
const eventRepository = AppDataSource.getRepository(Event);

/**
 * Get all teams with optional event filter
 * GET /api/teams?eventId=xxx
 */
export async function getTeams(req: Request, res: Response): Promise<void> {
  try {
    const eventId = req.query.eventId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;

    const queryBuilder = teamRepository.createQueryBuilder('team');

    if (eventId) {
      queryBuilder.where('team.eventId = :eventId', { eventId });
    }

    const [teams, total] = await queryBuilder
      .leftJoinAndSelect('team.event', 'event')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('team.createdAt', 'DESC')
      .getManyAndCount();

    res.json({
      success: true,
      data: {
        teams,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener equipos',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get single team by ID
 * GET /api/teams/:id
 */
export async function getTeamById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const team = await teamRepository.findOne({
      where: { id },
      relations: ['event', 'gameParticipants'],
    });

    if (!team) {
      res.status(404).json({
        success: false,
        message: 'Equipo no encontrado',
      });
      return;
    }

    res.json({
      success: true,
      data: team,
    });
  } catch (error) {
    console.error('Get team by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener equipo',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Create new team
 * POST /api/teams
 */
export async function createTeam(req: Request, res: Response): Promise<void> {
  try {
    const { name, icon, color, eventId } = req.body;

    // Validate required fields
    if (!name || !icon || !color) {
      res.status(400).json({
        success: false,
        message: 'Nombre, icono y color son requeridos',
      });
      return;
    }

    // Validate event exists if provided
    if (eventId) {
      const event = await eventRepository.findOne({ where: { id: eventId } });
      if (!event) {
        res.status(404).json({
          success: false,
          message: 'Evento no encontrado',
        });
        return;
      }
    }

    // Create team
    const team = teamRepository.create({
      name,
      icon,
      color,
      eventId: eventId || null,
    });

    await teamRepository.save(team);

    // Fetch the team with relations
    const savedTeam = await teamRepository.findOne({
      where: { id: team.id },
      relations: ['event'],
    });

    res.status(201).json({
      success: true,
      message: 'Equipo creado exitosamente',
      data: savedTeam,
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear equipo',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Update team
 * PUT /api/teams/:id
 */
export async function updateTeam(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, icon, color, eventId } = req.body;

    const team = await teamRepository.findOne({ where: { id } });

    if (!team) {
      res.status(404).json({
        success: false,
        message: 'Equipo no encontrado',
      });
      return;
    }

    // Validate event exists if provided
    if (eventId) {
      const event = await eventRepository.findOne({ where: { id: eventId } });
      if (!event) {
        res.status(404).json({
          success: false,
          message: 'Evento no encontrado',
        });
        return;
      }
    }

    // Update fields
    if (name !== undefined) team.name = name;
    if (icon !== undefined) team.icon = icon;
    if (color !== undefined) team.color = color;
    if (eventId !== undefined) team.eventId = eventId;

    await teamRepository.save(team);

    // Fetch updated team with relations
    const updatedTeam = await teamRepository.findOne({
      where: { id },
      relations: ['event'],
    });

    res.json({
      success: true,
      message: 'Equipo actualizado exitosamente',
      data: updatedTeam,
    });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar equipo',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Delete team
 * DELETE /api/teams/:id
 */
export async function deleteTeam(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const team = await teamRepository.findOne({
      where: { id },
      relations: ['gameParticipants'],
    });

    if (!team) {
      res.status(404).json({
        success: false,
        message: 'Equipo no encontrado',
      });
      return;
    }

    // Check if team is being used in any games
    if (team.gameParticipants && team.gameParticipants.length > 0) {
      res.status(400).json({
        success: false,
        message: 'No se puede eliminar un equipo que está participando en juegos',
      });
      return;
    }

    await teamRepository.remove(team);

    res.json({
      success: true,
      message: 'Equipo eliminado exitosamente',
    });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar equipo',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
