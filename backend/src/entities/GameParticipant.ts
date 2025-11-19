import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Team } from './Team';
import { Game } from './Game';
import { Answer } from './Answer';

@Entity('game_participants')
export class GameParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => User, (user) => user.gameParticipants, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  guestIdentifier: string; // For guest users: "guest_timestamp_random"

  @Column({ nullable: true })
  teamId: string;

  @ManyToOne(() => Team, (team) => team.gameParticipants, { nullable: true })
  @JoinColumn({ name: 'teamId' })
  team: Team;

  @Column()
  gameId: string;

  @ManyToOne(() => Game, (game) => game.participants)
  @JoinColumn({ name: 'gameId' })
  game: Game;

  @Column({ default: 0 })
  score: number;

  @Column({ default: 0 })
  correctAnswers: number;

  @Column({ default: 0 })
  totalAnswers: number;

  @Column({ default: 0 })
  streak: number;

  @OneToMany(() => Answer, (answer) => answer.participant)
  answers: Answer[];

  @CreateDateColumn()
  joinedAt: Date;
}
