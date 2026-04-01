import { BadRequestException } from '@nestjs/common';
import { ParseCursorPipe } from './parse-cursor.pipe';

describe('ParseCursorPipe', () => {
  const pipe = new ParseCursorPipe();

  it('returns undefined for an empty cursor', () => {
    expect(pipe.transform(undefined)).toBeUndefined();
    expect(pipe.transform('')).toBeUndefined();
  });

  it('parses a valid ISO 8601 cursor', () => {
    expect(pipe.transform('2026-03-31T00:00:00.000Z')).toEqual(
      new Date('2026-03-31T00:00:00.000Z'),
    );
  });

  it('rejects an invalid cursor', () => {
    expect(() => pipe.transform('not-a-date')).toThrow(BadRequestException);
  });
});
