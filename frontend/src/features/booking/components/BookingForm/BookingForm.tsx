import React, { useEffect, useRef, useState } from 'react';
import { useCreateBooking } from '../../hooks';
import { Button } from '~/components/button';
import { Select } from '~/components/select';
import type { ICalendar } from '~/components/calendar';
import type { MeetingType } from '../../types';
import { MeetingTypeSelector } from '../MeetingTypeSelector';

interface BookingFormProps {
    calendar: ICalendar;
    slug: string;
    timeSlotId: number;
    when: Date;
    onCreated: () => void;
}

export function BookingForm({ calendar, slug, timeSlotId, when, onCreated }: BookingFormProps) {
    const createBookingMutation = useCreateBooking(slug, when.getFullYear(), when.getMonth() + 1);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);
    const locationRef = useRef<HTMLInputElement>(null);
    const meetingLinkRef = useRef<HTMLInputElement>(null);

    const [topic, setTopic] = useState(calendar.topics[0] ?? '');
    const [meetingType, setMeetingType] = useState<MeetingType>('ONLINE');

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        createBookingMutation.mutate({
            timeSlotId,
            topic,
            description: descriptionRef.current?.value ?? '',
            when: `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, '0')}-${String(when.getDate()).padStart(2, '0')}`,
            meetingType,
            location: meetingType === 'OFFLINE' ? locationRef.current?.value : undefined,
            meetingLink: meetingType === 'ONLINE' ? meetingLinkRef.current?.value : undefined,
        });
    };

    useEffect(() => {
        if (createBookingMutation.isSuccess) {
            onCreated();
        }
    }, [createBookingMutation.isSuccess, onCreated]);

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <label className="block text-sm font-semibold text-[var(--cohi-text-dark)] mb-2">
                    주제
                </label>
                <Select
                    value={topic}
                    onValueChange={setTopic}
                    options={calendar.topics.map((t) => ({ value: t, label: t }))}
                    data-testid="booking-topic-select"
                />
            </div>

            <MeetingTypeSelector
                value={meetingType}
                onChange={setMeetingType}
                locationRef={locationRef}
                meetingLinkRef={meetingLinkRef}
            />

            <div className="flex flex-col gap-1">
                <label htmlFor="description" className="block text-sm font-semibold text-[var(--cohi-text-dark)] mb-2">
                    설명
                </label>
                <textarea
                    ref={descriptionRef}
                    id="description"
                    data-testid="booking-description-textarea"
                    placeholder="이야기하고 싶은 내용을 자유롭게 적어주세요"
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-[var(--cohi-text-dark)] resize-none focus:outline-none focus:border-[var(--cohi-primary)] focus:ring-1 focus:ring-[var(--cohi-primary)]"
                />
            </div>
            <Button variant='primary' type="submit" disabled={createBookingMutation.isPending} size="lg" className='w-full'>
                {createBookingMutation.isPending ? '예약 신청 중...' : '예약 신청하기'}
            </Button>
            {createBookingMutation.isError && (
                <p data-testid="booking-error" className="text-sm text-red-500">{createBookingMutation.error.message}</p>
            )}
            {createBookingMutation.isSuccess && (
                <p data-testid="booking-success" className="text-green-600 text-sm">예약 생성 완료!</p>
            )}
        </form>
    );
}
