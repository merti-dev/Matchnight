import type {
  KnockoutsDto,
  MatchDetailDto,
  MatchDto,
  MetaDto,
  OnThisDayDto,
  RankingRowDto,
  SeasonSummaryDto,
  StandingsDto,
  TeamDetailDto,
} from '@matchnight/core';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * API istemcisi. Sayfalar fetch'le doğrudan uğraşmaz; ne istediklerini metot
 * adıyla söyler. Dönüş tipleri API'nin kullandığı sözleşmenin aynısı (@matchnight/core).
 * 404 -> null (sayfa notFound() gösterir), diğer hatalar -> ApiError.
 */
export class MatchnightApi {
  constructor(
    private readonly baseUrl: string,
    /** Next'in veri önbelleği: yanıtlar bu kadar saniye tazeleniyor. */
    private readonly revalidate = 60,
  ) {}

  private async get<T>(path: string): Promise<T | null> {
    const res = await fetch(`${this.baseUrl}${path}`, { next: { revalidate: this.revalidate } });
    if (res.status === 404) return null;
    if (!res.ok) throw new ApiError(res.status, `${path}: HTTP ${res.status}`);
    return (await res.json()) as T;
  }

  private async require<T>(path: string): Promise<T> {
    const data = await this.get<T>(path);
    if (data === null) throw new ApiError(404, `${path}: bulunamadı`);
    return data;
  }

  meta() {
    return this.require<MetaDto>('/meta');
  }

  seasons() {
    return this.require<SeasonSummaryDto[]>('/seasons');
  }

  standings(season: string) {
    return this.get<StandingsDto>(`/seasons/${season}/standings`);
  }

  knockouts(season: string) {
    return this.get<KnockoutsDto>(`/seasons/${season}/knockouts`);
  }

  seasonMatches(season: string) {
    return this.get<MatchDto[]>(`/seasons/${season}/matches`);
  }

  match(id: string) {
    return this.get<MatchDetailDto>(`/matches/${encodeURIComponent(id)}`);
  }

  upcoming(limit = 8) {
    return this.require<MatchDto[]>(`/matches/upcoming?limit=${limit}`);
  }

  latest(limit = 8) {
    return this.require<MatchDto[]>(`/matches/latest?limit=${limit}`);
  }

  onThisDay(date?: string) {
    return this.require<OnThisDayDto>(`/matches/on-this-day${date ? `?date=${date}` : ''}`);
  }

  team(id: string) {
    return this.get<TeamDetailDto>(`/teams/${encodeURIComponent(id)}`);
  }

  ranking() {
    return this.require<RankingRowDto[]>('/teams/ranking');
  }
}

// localhost yerine 127.0.0.1: WSL gibi ortamlarda "localhost" önce IPv6'ya (::1) gidip
// zaman aşımına düşebiliyor; IPv4 adresi her yerde aynı davranır.
export const api = new MatchnightApi(process.env.MATCHNIGHT_API_URL ?? 'http://127.0.0.1:3001/api');
