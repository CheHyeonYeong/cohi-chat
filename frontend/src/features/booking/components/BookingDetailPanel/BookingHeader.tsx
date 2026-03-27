import type { ReactNode } from 'react';
import { Tag } from '~/components';
import type { AttendanceStatus } from '../../types';
import { STATUS_LABELS } from '../../types';

interface BookingHeaderProps {
    displayName: string;
    roleLabel: string;
    attendanceStatus: AttendanceStatus;
    actions?: ReactNode;
}

export const BookingHeader = ({ displayName, roleLabel, attendanceStatus, actions }: BookingHeaderProps) => <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-cohi-bg-warm flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-cohi-primary">
                {displayName[0] || '?'}
            </span>
        </div>
        <div>
            <h2 className="flex items-center gap-2 font-bold text-cohi-text-dark">
                {displayName}
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
</div>;
