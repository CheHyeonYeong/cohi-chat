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
    const payload = message.payload;
    const topic = payload?.topic;
    const status = payload?.status;
    const bookingDate = payload?.bookingDate;
    const startTime = payload?.startTime;
    const endTime = payload?.endTime;

    const statusLabel: Record<string, string> = {
      SCHEDULED: '예약 확정',
      PENDING_REVIEW: '검토 중',
      CANCELLED: '취소됨',
      ATTENDED: '완료',
    };

    return (
      <div className="flex justify-center my-3">
        <div className="bg-[var(--cohi-bg-warm,#fdf6ee)] border border-[#e8d5c0] rounded-2xl px-5 py-4 text-sm text-gray-700 w-72 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-gray-900">{topic ?? '커피챗'} 신청</span>
            {status && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--cohi-primary,#b07d50)] text-white font-medium">
                {statusLabel[status] ?? status}
              </span>
            )}
          </div>
          {bookingDate && (
            <div className="flex items-center gap-2 text-gray-600 text-xs mt-1">
              <span className="text-gray-400">날짜</span>
              <span>{bookingDate}</span>
            </div>
          )}
          {startTime && endTime && (
            <div className="flex items-center gap-2 text-gray-600 text-xs mt-1">
              <span className="text-gray-400">시간</span>
              <span>{startTime} - {endTime}</span>
            </div>
          )}
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
