import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Check,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Participant } from './participant.entity';

export enum SeanceStatut {
  EN_ATTENTE = 'en_attente',
  EN_COURS = 'en_cours',
  TERMINEE = 'terminee',
  ANNULEE = 'annulee',
}

@Entity('seance')
@Check('"max_films" > 0 AND "max_films" <= 5')
export class Seance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150, nullable: false })
  nom: string;

  @Column({ type: 'timestamp', nullable: false })
  date: Date;

  @Column({ type: 'integer', nullable: true })
  max_films: number;

  @Column({ type: 'uuid', nullable: false })
  proprietaire_id: string;

  @Column({
    type: 'enum',
    enum: SeanceStatut,
    nullable: false,
  })
  statut: SeanceStatut;

  @Column({ type: 'varchar', length: 6, unique: true, nullable: true })
  code: string;

  @Column({ type: 'boolean', default: true })
  est_actif: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  cree_le: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  maj_le: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.seances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proprietaire_id' })
  proprietaire: User;

  @OneToMany(() => Participant, (participant) => participant.seance)
  participants: Participant[];
}