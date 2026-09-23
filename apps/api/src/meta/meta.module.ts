import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { MetaController } from './meta.controller.js';
import { MetaService } from './meta.service.js';

@Module({ imports: [DatabaseModule], controllers: [MetaController], providers: [MetaService], exports: [MetaService] })
export class MetaModule {}
