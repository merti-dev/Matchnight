import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppConfigModule } from './config/app.config.js';
import { DatabaseModule } from './database/database.module.js';
import { MatchesModule } from './matches/matches.module.js';
import { MetaModule } from './meta/meta.module.js';
import { SeasonsModule } from './seasons/seasons.module.js';
import { SyncModule } from './sync/sync.module.js';
import { SyncScheduler } from './sync/sync.scheduler.js';
import { TeamsModule } from './teams/teams.module.js';

/** HTTP uygulaması: API uç noktaları + periyodik senkron. */
@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    ScheduleModule.forRoot(),
    SyncModule,
    MetaModule,
    MatchesModule,
    SeasonsModule,
    TeamsModule,
  ],
  providers: [SyncScheduler],
})
export class AppModule {}

/** Konsol uygulaması: HTTP ve zamanlayıcı yok, sadece servisler (bin/console gibi). */
@Module({ imports: [AppConfigModule, DatabaseModule, SyncModule] })
export class CliModule {}
