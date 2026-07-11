import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { GateDevice } from './gate-device.entity';

@Entity('offline_sync_logs')
export class OfflineSyncLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  deviceId: string;

  @Column({ type: 'varchar', length: 100 })
  batchId: string;

  @Column({ type: 'int' })
  totalRecords: number;

  @Column({ type: 'int' })
  successRecords: number;

  @Column({ type: 'int' })
  failedRecords: number;

  @Column({ type: 'text', nullable: true })
  syncError: string;

  @ManyToOne(() => GateDevice)
  @JoinColumn({ name: 'deviceId' })
  device: GateDevice;

  @CreateDateColumn()
  createdAt: Date;
}
