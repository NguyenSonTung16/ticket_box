import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum UserRole {
  USER = 'USER',
  ORGANIZER = 'ORGANIZER',
  CHECKIN_STAFF = 'CHECKIN_STAFF',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'varchar', length: 20, default: UserRole.USER })
  role: string;

  @Column({ type: 'varchar', length: 50, default: 'ACTIVE' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
