import { BadRequestException, PipeTransform } from '@nestjs/common';

// Spring의 @InitBinder + Validator에 대응 — cursor 쿼리 파라미터 ISO 8601 검증 파이프
export class ParseCursorPipe implements PipeTransform {
  transform(value: unknown): string | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value !== 'string' || isNaN(new Date(value).getTime())) {
      throw new BadRequestException(
        'cursor 형식이 올바르지 않습니다. ISO 8601 타임스탬프를 사용하세요.',
      );
    }
    return value;
  }
}
