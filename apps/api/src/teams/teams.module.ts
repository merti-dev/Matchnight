import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { MetaModule } from '../meta/meta.module.js';
import { TeamsController } from './teams.controller.js';
import { TeamsService } from './teams.service.js';

@Module({ imports: [DatabaseModule, MetaModule], controllers: [TeamsController], providers: [TeamsService] })
export class TeamsModule {}
