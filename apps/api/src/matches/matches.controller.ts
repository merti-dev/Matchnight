import { Controller, Get, Param, Query } from '@nestjs/common';
import type { MatchDetailDto, MatchDto, OnThisDayDto } from '@matchnight/core';
import { LimitQuery, OnThisDayQuery } from '../common/query.dto.js';
import { MatchesService } from './matches.service.js';

/** Sabit yollar (:id'den önce tanımlanmalı, yoksa "upcoming" bir id sanılır). */
@Controller('matches')
export class MatchesController {
  constructor(private readonly service: MatchesService) {}

  @Get('upcoming')
  upcoming(@Query() q: LimitQuery): Promise<MatchDto[]> {
    return this.service.upcoming(q.limit);
  }

  @Get('latest')
  latest(@Query() q: LimitQuery): Promise<MatchDto[]> {
    return this.service.latest(q.limit);
  }

  @Get('on-this-day')
  onThisDay(@Query() q: OnThisDayQuery): Promise<OnThisDayDto> {
    return this.service.onThisDay(q.date);
  }

  @Get(':id')
  detail(@Param('id') id: string): Promise<MatchDetailDto> {
    return this.service.detail(id);
  }
}
