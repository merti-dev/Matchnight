import { Injectable, NotFoundException } from '@nestjs/common';
import { berlinDate, type MatchDetailDto, type MatchDto, type OnThisDayDto } from '@matchnight/core';
import { MatchRepository } from './match.repository.js';
import { toMatchDto } from './match.mapper.js';

@Injectable()
export class MatchesService {
  constructor(private readonly matches: MatchRepository) {}

  async upcoming(limit: number): Promise<MatchDto[]> {
    return (await this.matches.upcoming(limit)).map(toMatchDto);
  }

  async latest(limit: number): Promise<MatchDto[]> {
    return (await this.matches.latestFinished(limit)).map(toMatchDto);
  }

  async detail(id: string): Promise<MatchDetailDto> {
    const match = await this.matches.byId(id);
    if (!match) throw new NotFoundException(`maç bulunamadı: ${id}`);
    const [h2h, homeForm, awayForm] = await Promise.all([
      this.matches.headToHead(match.home.id, match.away.id),
      this.matches.forTeam(match.home.id, 5, match.kickoff),
      this.matches.forTeam(match.away.id, 5, match.kickoff),
    ]);
    return {
      match: toMatchDto(match),
      h2h: h2h.filter((m) => m.id !== id).map(toMatchDto),
      homeForm: homeForm.map(toMatchDto),
      awayForm: awayForm.map(toMatchDto),
    };
  }

  /** Bu tarihte oynanmış maçlar; hiç yoksa takvimde en yakın maç günü önerilir. */
  async onThisDay(date?: string): Promise<OnThisDayDto> {
    const monthDay = date ?? berlinDate(new Date()).slice(5);
    const matches = await this.matches.onDay(monthDay);
    if (matches.length) return { date: monthDay, matches: matches.map(toMatchDto), nearest: null };

    const days = await this.matches.monthDays();
    const toIndex = (md: string) => {
      const d = new Date(Date.UTC(2024, Number(md.slice(0, 2)) - 1, Number(md.slice(3))));
      return Math.round((d.getTime() - Date.UTC(2024, 0, 1)) / 86_400_000);
    };
    const target = toIndex(monthDay);
    const circular = (md: string) => {
      const diff = Math.abs(toIndex(md) - target);
      return Math.min(diff, 366 - diff);
    };
    const nearest = days.reduce<string | null>((best, md) => (best === null || circular(md) < circular(best) ? md : best), null);
    return { date: monthDay, matches: [], nearest };
  }
}
