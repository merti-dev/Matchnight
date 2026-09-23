import { Controller, Get, Param } from '@nestjs/common';
import type { KnockoutsDto, MatchDto, SeasonSummaryDto, StandingsDto } from '@matchnight/core';
import { SeasonParamPipe } from './season-param.pipe.js';
import { SeasonsService } from './seasons.service.js';

@Controller('seasons')
export class SeasonsController {
  constructor(private readonly service: SeasonsService) {}

  @Get()
  list(): Promise<SeasonSummaryDto[]> {
    return this.service.list();
  }

  @Get(':season/matches')
  matches(@Param('season', SeasonParamPipe) season: string): Promise<MatchDto[]> {
    return this.service.matchesOf(season);
  }

  @Get(':season/standings')
  standings(@Param('season', SeasonParamPipe) season: string): Promise<StandingsDto> {
    return this.service.standings(season);
  }

  @Get(':season/knockouts')
  knockouts(@Param('season', SeasonParamPipe) season: string): Promise<KnockoutsDto> {
    return this.service.knockouts(season);
  }
}
