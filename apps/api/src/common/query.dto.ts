import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

/**
 * Sorgu parametresi DTO'ları. Global ValidationPipe bunları doğrular ve tipe
 * çevirir; geçersiz istek controller'a hiç ulaşmadan 400 döner.
 */
export class LimitQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 10;
}

export class OnThisDayQuery {
  /** "MM-DD"; verilmezse bugünün Berlin tarihi. */
  @IsOptional()
  @Matches(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, { message: 'date MM-DD biçiminde olmalı' })
  date?: string;
}
