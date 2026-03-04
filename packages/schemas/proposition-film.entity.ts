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

@Entity('proposition_film')
@Unique('uk_proposition', ['seance_id', 'utilisateur_id', 'tmdb_id'])
export class PropositionFilm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  seance_id: string;

  @Column({ type: 'uuid', nullable: false })
  utilisateur_id: string;

  @Column({ type: 'integer', nullable: false })
  tmdb_id: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  propose_le: Date;

  // Relation
  @ManyToOne(() => Seance, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seance_id' })
  seance: Seance;
}
