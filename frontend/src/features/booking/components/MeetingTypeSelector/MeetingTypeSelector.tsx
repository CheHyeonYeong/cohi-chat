import { useMemo } from 'react';
import type { MeetingType } from '../../types';
import { cn } from '~/libs/cn';

interface MeetingTypeSelectorProps {
    value: MeetingType;
    onChange: (value: MeetingType) => void;
    location?: string;
    onLocationChange?: (value: string) => void;
    meetingLink?: string;
    onMeetingLinkChange?: (value: string) => void;
}

const buttonBaseStyles = cn(
    'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200'
);

const activeButtonStyles = cn(
    'border-[var(--cohi-primary)] bg-[var(--cohi-bg-warm)] text-[var(--cohi-primary)]'
);

const inactiveButtonStyles = cn(
    'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
);

const inputStyles = cn(
    'w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-[var(--cohi-text-dark)]',
    'placeholder:text-gray-400',
    'focus:outline-none focus:border-[var(--cohi-primary)] focus:ring-1 focus:ring-[var(--cohi-primary)]'
);

const fieldContainerStyles = cn(
    'flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-200'
);

function VideoIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
        </svg>
    );
}

function LocationIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
        </svg>
    );
}

interface TypeButtonProps {
    type: MeetingType;
    selected: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    testId: string;
}

function TypeButton({ type, selected, onClick, icon, label, testId }: TypeButtonProps) {
    return (
        <button
            type="button"
            data-testid={testId}
            onClick={onClick}
            className={cn(buttonBaseStyles, selected ? activeButtonStyles : inactiveButtonStyles)}
        >
            {icon}
            <span className="font-medium">{label}</span>
        </button>
    );
}

export function MeetingTypeSelector({
    value,
    onChange,
    location = '',
    onLocationChange,
    meetingLink = '',
    onMeetingLinkChange,
}: MeetingTypeSelectorProps) {
    const isOnline = value === 'ONLINE';
    const isOffline = value === 'OFFLINE';

    const typeButtons = useMemo(
        () => [
            {
                type: 'ONLINE' as const,
                label: '온라인',
                icon: <VideoIcon className="w-5 h-5" />,
                testId: 'meeting-type-online',
            },
            {
                type: 'OFFLINE' as const,
                label: '오프라인',
                icon: <LocationIcon className="w-5 h-5" />,
                testId: 'meeting-type-offline',
            },
        ],
        []
    );

    return (
        <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-semibold text-[var(--cohi-text-dark)]">
                미팅 방식
            </legend>

            <div className="flex gap-3">
                {typeButtons.map(({ type, label, icon, testId }) => (
                    <TypeButton
                        key={type}
                        type={type}
                        selected={value === type}
                        onClick={() => onChange(type)}
                        icon={icon}
                        label={label}
                        testId={testId}
                    />
                ))}
            </div>

            {isOnline && (
                <div className={fieldContainerStyles}>
                    <label htmlFor="meetingLink" className="text-sm font-medium text-gray-600">
                        화상회의 링크
                    </label>
                    <input
                        type="url"
                        id="meetingLink"
                        data-testid="meeting-link-input"
                        value={meetingLink}
                        onChange={(e) => onMeetingLinkChange?.(e.target.value)}
                        placeholder="예: https://meet.google.com/xxx-xxxx-xxx"
                        className={inputStyles}
                    />
                    <p className="text-xs text-gray-500">
                        Google Meet, Zoom 등 화상회의 링크를 입력해주세요
                    </p>
                </div>
            )}

            {isOffline && (
                <div className={fieldContainerStyles}>
                    <label htmlFor="location" className="text-sm font-medium text-gray-600">
                        만남 장소
                    </label>
                    <input
                        type="text"
                        id="location"
                        data-testid="location-input"
                        value={location}
                        onChange={(e) => onLocationChange?.(e.target.value)}
                        placeholder="예: 스타벅스 강남역점"
                        className={inputStyles}
                    />
                    <p className="text-xs text-gray-500">
                        오프라인 미팅 장소를 입력해주세요
                    </p>
                </div>
            )}
        </fieldset>
    );
}
