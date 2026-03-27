import { cn } from '~/libs/cn';
import type { MessageItem } from '../../api';

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

interface MessageBubbleProps {
  message: MessageItem;
  isMine: boolean;
}

function MessageBubble({ message, isMine }: MessageBubbleProps) {
  if (message.messageType === 'SYSTEM') {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-3 py-1">
          {message.content}
        </span>
      </div>
    );
  }

  if (message.messageType === 'RESERVATION_CARD') {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-[var(--cohi-bg-warm)] border border-[var(--cohi-primary-light,#e8d5c0)] rounded-xl px-4 py-3 text-sm text-gray-700 max-w-xs">
          📅 예약 카드
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-end gap-2', isMine ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-2 text-sm',
          isMine
            ? 'bg-[var(--cohi-primary)] text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-900 rounded-bl-sm',
        )}
      >
        {message.content}
      </div>
      <span className="text-[10px] text-gray-400 flex-shrink-0 mb-0.5">
        {formatTime(message.createdAt)}
      </span>
    </div>
  );
}

interface MessageListProps {
  messages: MessageItem[];
  currentUserId: string;
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  // API는 DESC 순서로 반환 → 화면은 ASC(오래된 것이 위)로 표시
  const ordered = [...messages].reverse();

  return (
    <div data-testid="message-list" className="flex flex-col gap-3 p-4 overflow-y-auto flex-1">
      {ordered.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isMine={msg.senderId === currentUserId}
        />
      ))}
    </div>
  );
}
