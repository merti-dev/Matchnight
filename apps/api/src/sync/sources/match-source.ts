import type { RawMatch } from '@matchnight/core';

/**
 * Bir veri kaynağı: maçları getirir, başka hiçbir şey bilmez.
 * Strategy pattern — senkron servisi hangi kaynakla konuştuğunu bilmez, bu arayüzü bilir.
 */
export interface MatchSource {
  readonly name: string;
  /** Kaynak yapılandırılmamışsa (ör. API anahtarı yok) false. */
  isEnabled(): boolean;
  load(): Promise<SourceBatch>;
}

export interface SourceBatch {
  matches: RawMatch[];
  seasons: string[];
  warnings: string[];
}

/*
 * TypeScript interface'leri çalışma anında yok olur, o yüzden Nest onları doğrudan
 * enjekte edemez; bir token gerekir. Symfony'de services.yaml'daki şu satırın karşılığı:
 *   App\Sync\MatchSource $archiveSource: '@App\Sync\OpenfootballSource'
 */
export const ARCHIVE_SOURCE = Symbol('ARCHIVE_SOURCE');
export const LIVE_SOURCE = Symbol('LIVE_SOURCE');
