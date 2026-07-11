import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ArtistDocument } from './artist-document.entity';

@Entity('ai_jobs')
export class AiJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  documentId: string;

  @Column({ type: 'varchar', length: 50, default: 'PENDING' })
  status: string; // PENDING | EXTRACTING | SUMMARIZING | COMPLETED | FAILED

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @ManyToOne(() => ArtistDocument)
  @JoinColumn({ name: 'documentId' })
  document: ArtistDocument;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
