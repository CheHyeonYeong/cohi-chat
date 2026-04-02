import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

const ISO_8601_CURSOR_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

@Injectable()
export class ParseCursorPipe implements PipeTransform<
  string | undefined,
  Date | undefined
> {
  transform(value: string | undefined): Date | undefined {
    if (value === undefined || value === '') {
      return undefined;
    }

    if (!ISO_8601_CURSOR_PATTERN.test(value)) {
      throw new BadRequestException('cursor must be an ISO 8601 date string.');
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('cursor must be an ISO 8601 date string.');
    }

    return date;
  }
}