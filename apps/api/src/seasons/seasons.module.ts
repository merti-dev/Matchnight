import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { SeasonsController } from './seasons.controller.js';
import { SeasonsService } from './seasons.service.js';

@Module({ imports: [DatabaseModule], controllers: [SeasonsController], providers: [SeasonsService] })
export class SeasonsModule {}
