import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ListeFilm } from './liste-film.entity';

@Entity('liste')
export class Liste {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150, nullable: false })
  nom: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', nullable: false })
  utilisateur_id: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  cree_le: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  maj_le: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.listes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'utilisateur_id' })
  utilisateur: User;

  @OneToMany(() => ListeFilm, (listeFilm) => listeFilm.liste)
  films: ListeFilm[];
}