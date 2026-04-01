import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseCursorPipe implements PipeTransform<
  string | undefined,
  Date | undefined
> {
  transform(value: string | undefined): Date | undefined {
    if (value === undefined || value === '') {
      return undefined;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('cursor must be an ISO 8601 date string.');
    }

    return date;
  }
}
