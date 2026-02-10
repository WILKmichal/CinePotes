import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Seance } from './seance.entity';
import { User } from '../../users/entities/user.entity';

@Entity('participant')
@Unique('uk_participant', ['seance_id', 'utilisateur_id'])
export class Participant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  seance_id: string;

  @Column({ type: 'uuid', nullable: false })
  utilisateur_id: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  a_rejoint_le: Date;

  // Relations
  @ManyToOne(() => Seance, (seance) => seance.participants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'seance_id' })
  seance: Seance;

  @ManyToOne(() => User, (user) => user.participations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'utilisateur_id' })
  utilisateur: User;
}