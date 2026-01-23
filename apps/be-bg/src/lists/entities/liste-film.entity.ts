import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Liste } from './liste.entity';

@Entity('listefilm')
@Unique('uk_listefilm', ['liste_id', 'tmdb_id'])
export class ListeFilm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  liste_id: string;

  @Column({ type: 'integer', nullable: false })
  tmdb_id: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  cree_le: Date;

  // Relations
  @ManyToOne(() => Liste, (liste) => liste.films, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'liste_id' })
  liste: Liste;
}