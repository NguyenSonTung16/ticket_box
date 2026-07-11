import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Concert } from '../../info/entities/concert.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('artist_documents')
export class ArtistDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  concertId: number;

  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'varchar', length: 512 })
  fileUrl: string;

  @Column({ type: 'int' })
  fileSize: number;

  @Column({ type: 'uuid' })
  uploadedBy: string;

  @ManyToOne(() => Concert)
  @JoinColumn({ name: 'concertId' })
  concert: Concert;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploadedBy' })
  uploader: User;

  @CreateDateColumn()
  createdAt: Date;
}
