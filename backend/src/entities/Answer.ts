import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Question } from './Question';
import { GameParticipant } from './GameParticipant';

@Entity('answers')
export class Answer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  participantId: string;

  @ManyToOne(() => GameParticipant, (participant) => participant.answers)
  @JoinColumn({ name: 'participantId' })
  participant: GameParticipant;

  @Column()
  questionId: string;

  @ManyToOne(() => Question, (question) => question.answers)
  @JoinColumn({ name: 'questionId' })
  question: Question;

  @Column()
  selectedAnswer: number;

  @Column()
  isCorrect: boolean;

  @Column()
  points: number;

  @Column()
  timeRemaining: number;

  @CreateDateColumn()
  answeredAt: Date;
}
