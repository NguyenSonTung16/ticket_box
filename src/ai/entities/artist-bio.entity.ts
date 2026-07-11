import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Concert } from '../../info/entities/concert.entity';
import { AiJob } from './ai-job.entity';
import { PromptTemplate } from './prompt-template.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('artist_bios')
export class ArtistBio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', nullable: true })
  concertId: number;

  @Column({ type: 'uuid', nullable: true })
  jobId: string;

  @Column({ type: 'uuid', nullable: true })
  promptTemplateId: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  artistName: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  stageName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl: string;

  @Column({ type: 'simple-array', nullable: true })
  genres: string[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({ type: 'text' })
  shortBio: string;

  @Column({ type: 'text' })
  mediumBio: string;

  @Column({ type: 'text' })
  seoBio: string;

  @Column({ type: 'varchar', length: 50, default: 'PENDING_REVIEW' })
  status: string; // PENDING_REVIEW | APPROVED | REJECTED

  @Column({ type: 'uuid', nullable: true })
  reviewedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @ManyToOne(() => Concert)
  @JoinColumn({ name: 'concertId' })
  concert: Concert;

  @ManyToOne(() => AiJob)
  @JoinColumn({ name: 'jobId' })
  job: AiJob;

  @ManyToOne(() => PromptTemplate)
  @JoinColumn({ name: 'promptTemplateId' })
  promptTemplate: PromptTemplate;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewedBy' })
  reviewer: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
