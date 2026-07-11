import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('gate_devices')
export class GateDevice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, type: 'varchar', length: 100 })
  deviceCode: string;

  @Column({ type: 'varchar', length: 100 })
  gateName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string;

  @Column({ type: 'varchar', length: 50, default: 'ACTIVE' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  lastSyncAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
