import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Event } from './Event';
import { GameParticipant } from './GameParticipant';

export enum GameMode {
  KAHOOT = 'kahoot', // Turn-based, sequential questions
  GEOPARTY = 'geoparty', // Individual, choose your own question
  WORDSEARCH = 'wordsearch', // Word search puzzle game
}

export enum GameStatus {
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished',
}

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true, length: 6 })
  roomCode: string;

  @Column({
    type: 'enum',
    enum: GameMode,
    default: GameMode.KAHOOT,
  })
  mode: GameMode;

  @Column({
    type: 'enum',
    enum: GameStatus,
    default: GameStatus.WAITING,
  })
  status: GameStatus;

  @Column({ nullable: true })
  eventId: string;

  @ManyToOne(() => Event, (event) => event.games, { nullable: true })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @OneToMany(() => GameParticipant, (participant) => participant.game)
  participants: GameParticipant[];

  @Column({ type: 'json', nullable: true })
  usedQuestionIds: string[];

  @Column({ default: 10 })
  totalQuestions: number;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  finishedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
