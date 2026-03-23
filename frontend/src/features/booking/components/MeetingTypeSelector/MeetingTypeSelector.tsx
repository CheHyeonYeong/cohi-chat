import { useMemo } from 'react';
import type { MeetingType } from '../../types';
import { cn } from '~/libs/cn';
import { VideoIcon, LocationIcon } from '~/components/icons';
import { TypeButton } from './TypeButton';

interface MeetingTypeSelectorProps {
    value: MeetingType;
    onChange: (value: MeetingType) => void;
    location?: string;
    onLocationChange?: (value: string) => void;
    meetingLink?: string;
    onMeetingLinkChange?: (value: string) => void;
}

const inputStyles = cn(
    'w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-cohi-text-dark',
    'placeholder:text-gray-400',
    'focus:outline-none focus:border-cohi-primary focus:ring-1 focus:ring-cohi-primary'
);

const fieldContainerStyles = cn(
    'flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-200'
);

export const MeetingTypeSelector = ({
    value,
    onChange,
    location = '',
    onLocationChange,
    meetingLink = '',
    onMeetingLinkChange,
}: MeetingTypeSelectorProps) => {
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
            <legend className="text-sm font-semibold text-cohi-text-dark">
                미팅 방식
            </legend>

            <div className="flex gap-3">
                {typeButtons.map(({ type, label, icon, testId }) => (
                    <TypeButton
                        key={type}
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
                        placeholder="예: https://www.cohi-chat.com"
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
};
