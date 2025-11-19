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

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  icon: string;

  @Column()
  color: string;

  @Column({ nullable: true })
  eventId: string;

  @ManyToOne(() => Event, (event) => event.teams, { nullable: true })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @OneToMany(() => GameParticipant, (participant) => participant.team)
  gameParticipants: GameParticipant[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
