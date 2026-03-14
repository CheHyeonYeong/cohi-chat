import type { MeetingType } from '../../types';
import { cn } from '~/libs/cn';

interface MeetingTypeSelectorProps {
    value: MeetingType;
    onChange: (value: MeetingType) => void;
    locationRef?: React.RefObject<HTMLInputElement>;
    meetingLinkRef?: React.RefObject<HTMLInputElement>;
    defaultLocation?: string;
    defaultMeetingLink?: string;
}

export function MeetingTypeSelector({
    value,
    onChange,
    locationRef,
    meetingLinkRef,
    defaultLocation = '',
    defaultMeetingLink = '',
}: MeetingTypeSelectorProps) {
    return (
        <div className="flex flex-col gap-3">
            <span className="text-sm font-semibold text-[var(--cohi-text-dark)]">
                미팅 방식
            </span>

            <div className="flex gap-3">
                <button
                    type="button"
                    data-testid="meeting-type-online"
                    onClick={() => onChange('ONLINE')}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200',
                        value === 'ONLINE'
                            ? 'border-[var(--cohi-primary)] bg-[var(--cohi-bg-warm)] text-[var(--cohi-primary)]'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    )}
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                    </svg>
                    <span className="font-medium">온라인</span>
                </button>

                <button
                    type="button"
                    data-testid="meeting-type-offline"
                    onClick={() => onChange('OFFLINE')}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200',
                        value === 'OFFLINE'
                            ? 'border-[var(--cohi-primary)] bg-[var(--cohi-bg-warm)] text-[var(--cohi-primary)]'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    )}
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
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
                    <span className="font-medium">오프라인</span>
                </button>
            </div>

            {value === 'ONLINE' && (
                <div className="flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    <label
                        htmlFor="meetingLink"
                        className="text-sm font-medium text-gray-600"
                    >
                        화상회의 링크
                    </label>
                    <input
                        ref={meetingLinkRef}
                        type="url"
                        id="meetingLink"
                        data-testid="meeting-link-input"
                        defaultValue={defaultMeetingLink}
                        placeholder="예: https://meet.google.com/xxx-xxxx-xxx"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-[var(--cohi-text-dark)] placeholder:text-gray-400 focus:outline-none focus:border-[var(--cohi-primary)] focus:ring-1 focus:ring-[var(--cohi-primary)]"
                    />
                    <p className="text-xs text-gray-500">
                        Google Meet, Zoom 등 화상회의 링크를 입력해주세요
                    </p>
                </div>
            )}

            {value === 'OFFLINE' && (
                <div className="flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    <label
                        htmlFor="location"
                        className="text-sm font-medium text-gray-600"
                    >
                        만남 장소
                    </label>
                    <input
                        ref={locationRef}
                        type="text"
                        id="location"
                        data-testid="location-input"
                        defaultValue={defaultLocation}
                        placeholder="예: 스타벅스 강남역점"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-[var(--cohi-text-dark)] placeholder:text-gray-400 focus:outline-none focus:border-[var(--cohi-primary)] focus:ring-1 focus:ring-[var(--cohi-primary)]"
                    />
                    <p className="text-xs text-gray-500">
                        오프라인 미팅 장소를 입력해주세요
                    </p>
                </div>
            )}
        </div>
    );
}
