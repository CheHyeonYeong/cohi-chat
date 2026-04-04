const CURSOR_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const INVALID_CURSOR_MESSAGE = 'cursor must be a valid message cursor.';

export type MessageCursor = {
  createdAt: string;
  id: string;
};

export function encodeMessageCursor(cursor: MessageCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

export function decodeMessageCursor(value: string): MessageCursor | null {
  const decoded = decodeBase64Url(value);
  if (!decoded) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(decoded);
    if (!isMessageCursor(parsed)) {
      return null;
    }

    return {
      createdAt: parsed.createdAt,
      id: parsed.id,
    };
  } catch {
    return null;
  }
}

function decodeBase64Url(value: string): string | null {
  try {
    return Buffer.from(value, 'base64url').toString('utf8');
  } catch {
    return null;
  }
}

function isMessageCursor(value: unknown): value is MessageCursor {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<MessageCursor>;
  return (
    typeof candidate.createdAt === 'string' &&
    CURSOR_TIMESTAMP_PATTERN.test(candidate.createdAt) &&
    typeof candidate.id === 'string' &&
    UUID_PATTERN.test(candidate.id)
  );
}