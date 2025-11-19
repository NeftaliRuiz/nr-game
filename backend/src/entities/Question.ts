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
import { Answer } from './Answer';

export enum QuestionDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  category: string;

  @Column({
    type: 'enum',
    enum: QuestionDifficulty,
    default: QuestionDifficulty.MEDIUM,
  })
  difficulty: QuestionDifficulty;

  @Column()
  points: number;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'json' })
  options: string[];

  @Column()
  correctAnswer: number;

  @Column({ default: 20 })
  timeLimit: number;

  @Column({ nullable: true })
  eventId: string;

  @Column({ nullable: true, default: 1 })
  round: number; // Ronda/Round number for organizing questions

  @Column({ nullable: true })
  gameMode: string; // 'KAHOOT' or 'GEOPARTY'

  @ManyToOne(() => Event, (event) => event.questions, { nullable: true })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @OneToMany(() => Answer, (answer) => answer.question)
  answers: Answer[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
