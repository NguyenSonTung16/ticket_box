import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';

import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiWorker } from './ai.worker';
import { ArtistDocument } from './entities/artist-document.entity';
import { AiJob } from './entities/ai-job.entity';
import { PromptTemplate } from './entities/prompt-template.entity';
import { ArtistBio } from './entities/artist-bio.entity';
import { Concert } from '../info/entities/concert.entity';
import { ShowInfo, ShowInfoSchema } from '../info/schemas/show-info.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ArtistDocument, AiJob, PromptTemplate, ArtistBio, Concert]),
    MongooseModule.forFeature([{ name: ShowInfo.name, schema: ShowInfoSchema }]),
    AuthModule,
  ],
  controllers: [AiController],
  providers: [AiService, AiWorker],
  exports: [AiService],
})
export class AiModule {}
