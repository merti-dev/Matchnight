import { Controller, Get, Param } from '@nestjs/common';
import type { RankingRowDto, TeamDetailDto } from '@matchnight/core';
import { TeamsService } from './teams.service.js';

@Controller('teams')
export class TeamsController {
  constructor(private readonly service: TeamsService) {}

  @Get('ranking')
  ranking(): Promise<RankingRowDto[]> {
    return this.service.ranking();
  }

  @Get(':id')
  detail(@Param('id') id: string): Promise<TeamDetailDto> {
    return this.service.detail(id);
  }
}
