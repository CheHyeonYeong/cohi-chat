import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

// Spring의 HandlerMethodArgumentResolver / @RequestParam + Converter에 대응
// NestJS Pipe = 컨트롤러 파라미터 변환 + 검증 레이어
@Injectable()
export class ParseCursorPipe
  implements PipeTransform<string | undefined, Date | undefined>
{
  transform(value: string | undefined): Date | undefined {
    if (value === undefined || value === '') {
      return undefined;
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('cursor는 ISO 8601 형식이어야 합니다.');
    }
    return date;
  }
}
