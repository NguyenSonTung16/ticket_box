import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Ticket } from '../../booking/entities/ticket.entity';
import { User } from '../../auth/entities/user.entity';
import { GateDevice } from './gate-device.entity';

@Entity('checkins')
export class Checkin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  ticketId: string;

  @Column({ type: 'uuid' })
  checkerId: string;

  @Column({ type: 'uuid' })
  deviceId: string;

  @Column({ type: 'timestamp' })
  scannedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  syncedAt: Date;

  @Column({ type: 'boolean', default: false })
  isOffline: boolean;

  @Column({ type: 'varchar', length: 50, default: 'SUCCESS' })
  syncStatus: string; // SUCCESS | DUPLICATE | CONFLICT

  @Column({ type: 'text', nullable: true })
  rawPayload: string;

  @ManyToOne(() => Ticket)
  @JoinColumn({ name: 'ticketId' })
  ticket: Ticket;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'checkerId' })
  checker: User;

  @ManyToOne(() => GateDevice)
  @JoinColumn({ name: 'deviceId' })
  device: GateDevice;

  @CreateDateColumn()
  createdAt: Date;
}
