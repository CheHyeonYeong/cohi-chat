import { cn } from '~/libs/cn';
import type { ITimeSlot } from '~/features/calendar';

const DAY_NAMES: Record<number, string> = {
    0: '일',
    1: '월',
    2: '화',
    3: '수',
    4: '목',
    5: '금',
    6: '토',
};

function normalizeTime(time: string): string {
    return time.slice(0, 5);
}

interface HostTimeSlotPreviewProps {
    timeslots: ITimeSlot[];
    isLoading?: boolean;
    className?: string;
}

export default function HostTimeSlotPreview({
    timeslots,
    isLoading,
    className,
}: HostTimeSlotPreviewProps) {
    if (isLoading) {
        return (
            <div data-testid="host-timeslot-preview-loading" className="text-gray-500 text-sm">
                시간대를 불러오는 중...
            </div>
        );
    }

    if (timeslots.length === 0) {
        return (
            <div data-testid="host-timeslot-preview-empty" className="text-gray-500 text-sm">
                등록된 예약 가능 시간이 없습니다.
            </div>
        );
    }

    return (
        <div data-testid="host-timeslot-preview" className={cn('space-y-3', className)}>
            {timeslots.map((slot) => {
                const weekdayLabels = [...slot.weekdays]
                    .sort((a, b) => a - b)
                    .map((d) => DAY_NAMES[d])
                    .join(', ');

                return (
                    <div
                        key={slot.id}
                        className="flex items-center gap-3 bg-[var(--cohe-bg-warm)]/50 rounded-lg px-4 py-3"
                    >
                        <span className="text-sm font-medium text-[var(--cohe-text-dark)]">
                            {weekdayLabels}
                        </span>
                        <span className="text-sm text-gray-600">
                            {normalizeTime(slot.startTime)} - {normalizeTime(slot.endTime)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
