import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { MatchesController } from './matches.controller.js';
import { MatchesService } from './matches.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [MatchesController],
  providers: [MatchesService],
})
export class MatchesModule {}
