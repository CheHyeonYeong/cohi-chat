import { BadRequestException } from '@nestjs/common';
import { encodeMessageCursor } from '../message-cursor';
import { ParseCursorPipe } from './parse-cursor.pipe';

describe('ParseCursorPipe', () => {
  const pipe = new ParseCursorPipe();
  const validCursor = encodeMessageCursor({
    createdAt: '2026-03-31T00:00:00.123001Z',
    id: '11111111-1111-4111-8111-111111111111',
  });

  it('returns undefined for an empty cursor', () => {
    expect(pipe.transform(undefined)).toBeUndefined();
    expect(pipe.transform('')).toBeUndefined();
  });

  it('parses a valid opaque cursor', () => {
    expect(pipe.transform(validCursor)).toEqual({
      createdAt: '2026-03-31T00:00:00.123001Z',
      id: '11111111-1111-4111-8111-111111111111',
    });
  });

  it('rejects an invalid cursor', () => {
    expect(() => pipe.transform('not-a-cursor')).toThrow(BadRequestException);
    expect(() =>
      pipe.transform(
        encodeMessageCursor({
          createdAt: '2026/03/31',
          id: '11111111-1111-4111-8111-111111111111',
        }),
      ),
    ).toThrow(BadRequestException);
    expect(() =>
      pipe.transform(
        encodeMessageCursor({
          createdAt: '2026-03-31T00:00:00.123001Z',
          id: 'not-a-uuid',
        }),
      ),
    ).toThrow(BadRequestException);
  });
});