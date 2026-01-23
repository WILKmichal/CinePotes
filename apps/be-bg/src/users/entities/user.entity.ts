import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Seance } from '../../seances/entities/seance.entity';
import { Participant } from '../../seances/entities/participant.entity';
import { Liste } from '../../lists/entities/liste.entity';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  CHEF = 'chef',
}

@Entity('utilisateur')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  nom: string;

  @Column({ type: 'varchar', length: 180, unique: true, nullable: false })
  email: string;

  @Column({ type: 'text', nullable: false })
  mot_de_passe_hash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    nullable: false,
  })
  role: UserRole;

  //Email verification
  @Column({ type: 'boolean', nullable: false, default: false })
  email_verifie: boolean;

  @Column({ type: 'uuid', nullable: true })
  email_verification_token: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  cree_le: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  maj_le: Date;

  // Relations
  @OneToMany(() => Seance, (seance) => seance.proprietaire)
  seances: Seance[];

  @OneToMany(() => Participant, (participant) => participant.utilisateur)
  participations: Participant[];

  @OneToMany(() => Liste, (liste) => liste.utilisateur)
  listes: Liste[];
}