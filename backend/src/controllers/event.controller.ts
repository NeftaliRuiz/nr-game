import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Event, EventStatus } from '../entities/Event';
import { Team } from '../entities/Team';
import { Question } from '../entities/Question';

const eventRepository = AppDataSource.getRepository(Event);
const teamRepository = AppDataSource.getRepository(Team);
const questionRepository = AppDataSource.getRepository(Question);

/**
 * Get all events with pagination
 * GET /api/events
 */
export async function getEvents(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    const queryBuilder = eventRepository.createQueryBuilder('event');

    if (status) {
      queryBuilder.where('event.status = :status', { status });
    }

    const [events, total] = await queryBuilder
      .leftJoinAndSelect('event.teams', 'team')
      .leftJoinAndSelect('event.questions', 'question')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('event.createdAt', 'DESC')
      .getManyAndCount();

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
    });
  }
}

/**
 * Get event by ID
 * GET /api/events/:id
 */
export async function getEventById(req: Request, res: Response): Promise<void> {
  try {
    const eventId = req.params.id;

    const event = await eventRepository.findOne({
      where: { id: eventId },
      relations: ['teams', 'questions', 'games'],
    });

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found',
      });
      return;
    }

    res.json({
      success: true,
      data: { event },
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event',
    });
  }
}

/**
 * Create a new event
 * POST /api/events
 */
export async function createEvent(req: Request, res: Response): Promise<void> {
  try {
    const { name, description, startDate, endDate } = req.body;

    const event = eventRepository.create({
      name,
      description,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status: EventStatus.UPCOMING,
    });

    await eventRepository.save(event);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: { event },
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event',
    });
  }
}

/**
 * Update event
 * PUT /api/events/:id
 */
export async function updateEvent(req: Request, res: Response): Promise<void> {
  try {
    const eventId = req.params.id;
    const { name, description, startDate, endDate, status } = req.body;

    const event = await eventRepository.findOne({ where: { id: eventId } });

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found',
      });
      return;
    }

    if (name) event.name = name;
    if (description !== undefined) event.description = description;
    if (startDate) event.startDate = new Date(startDate);
    if (endDate) event.endDate = new Date(endDate);
    if (status) event.status = status;

    await eventRepository.save(event);

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: { event },
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event',
    });
  }
}

/**
 * Delete event
 * DELETE /api/events/:id
 */
export async function deleteEvent(req: Request, res: Response): Promise<void> {
  try {
    const eventId = req.params.id;

    const result = await eventRepository.delete(eventId);

    if (result.affected === 0) {
      res.status(404).json({
        success: false,
        message: 'Event not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event',
    });
  }
}

/**
 * Add team to event
 * POST /api/events/:id/teams
 */
export async function addTeamToEvent(req: Request, res: Response): Promise<void> {
  try {
    const eventId = req.params.id;
    const { name } = req.body;

    const event = await eventRepository.findOne({ where: { id: eventId } });

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found',
      });
      return;
    }

    const team = teamRepository.create({
      name,
      eventId,
    });

    await teamRepository.save(team);

    res.status(201).json({
      success: true,
      message: 'Team added to event successfully',
      data: { team },
    });
  } catch (error) {
    console.error('Add team to event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add team to event',
    });
  }
}

/**
 * Get teams for an event
 * GET /api/events/:id/teams
 */
export async function getEventTeams(req: Request, res: Response): Promise<void> {
  try {
    const eventId = req.params.id;

    const teams = await teamRepository.find({
      where: { eventId },
      order: { createdAt: 'ASC' },
    });

    res.json({
      success: true,
      data: { teams },
    });
  } catch (error) {
    console.error('Get event teams error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event teams',
    });
  }
}

/**
 * Get questions for an event
 * GET /api/events/:id/questions
 */
export async function getEventQuestions(req: Request, res: Response): Promise<void> {
  try {
    const eventId = req.params.id;

    const questions = await questionRepository.find({
      where: { eventId },
      order: { createdAt: 'ASC' },
    });

    res.json({
      success: true,
      data: { questions },
    });
  } catch (error) {
    console.error('Get event questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event questions',
    });
  }
}
