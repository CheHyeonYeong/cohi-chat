import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import {
  decodeMessageCursor,
  INVALID_CURSOR_MESSAGE,
  MessageCursor,
} from '../message-cursor';

@Injectable()
export class ParseCursorPipe implements PipeTransform<
  string | undefined,
  MessageCursor | undefined
> {
  transform(value: string | undefined): MessageCursor | undefined {
    if (value === undefined || value === '') {
      return undefined;
    }

    const cursor = decodeMessageCursor(value);
    if (!cursor) {
      throw new BadRequestException(INVALID_CURSOR_MESSAGE);
    }

    return cursor;
  }
}