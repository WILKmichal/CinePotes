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

@Entity('vote_classement')
@Unique('uk_vote', ['seance_id', 'utilisateur_id', 'tmdb_id'])
export class VoteClassement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  seance_id: string;

  @Column({ type: 'uuid', nullable: false })
  utilisateur_id: string;

  @Column({ type: 'integer', nullable: false })
  tmdb_id: number;

  /** Rang donné par cet utilisateur à ce film (1 = préféré) */
  @Column({ type: 'integer', nullable: false })
  rang: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  vote_le: Date;

  @ManyToOne(() => Seance, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seance_id' })
  seance: Seance;
}
