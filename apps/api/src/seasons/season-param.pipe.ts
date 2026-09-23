import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';

/**
 * Yol parametresini doğrulayan pipe: "2025-26" biçimi ve ardışık yıllar.
 * Symfony'deki route requirements (#[Route(requirements: [...])]) karşılığı.
 */
@Injectable()
export class SeasonParamPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const m = /^(\d{4})-(\d{2})$/.exec(value);
    if (!m || (Number(m[1]) + 1) % 100 !== Number(m[2])) {
      throw new BadRequestException(`geçersiz sezon: "${value}" (ör. 2025-26)`);
    }
    return value;
  }
}
