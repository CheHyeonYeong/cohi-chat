import { Tag } from '~/components';
import type { AttendanceStatus } from '../../types';
import { STATUS_LABELS } from '../../types';

interface BookingHeaderProps {
    displayName: string;
    roleLabel: string;
    attendanceStatus: AttendanceStatus;
    actions?: React.ReactNode;
}

export function BookingHeader({ displayName, roleLabel, attendanceStatus, actions }: BookingHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--cohi-bg-warm)] flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-[var(--cohi-primary)]">
                        {displayName[0] || '?'}
                    </span>
                </div>
                <div>
                    <h2 className="font-bold text-[var(--cohi-text-dark)]">
                        {displayName}{' '}
                        <Tag variant="filled" color="default" size="sm">
                            {STATUS_LABELS[attendanceStatus] ?? attendanceStatus}
                        </Tag>
                    </h2>
                    <p className="text-xs text-gray-500">{roleLabel}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {actions}
            </div>
        </div>
    );
}
