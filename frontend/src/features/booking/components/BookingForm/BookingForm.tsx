import { useCallback, useEffect, useMemo, useState } from 'react';
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

interface BookingFormState {
    topic: string;
    description: string;
    meetingType: MeetingType;
    location: string;
    meetingLink: string;
}

const formatDateToISO = (date: Date): string =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const createInitialState = (defaultTopic: string): BookingFormState => ({
    topic: defaultTopic,
    description: '',
    meetingType: 'ONLINE',
    location: '',
    meetingLink: '',
});

export function BookingForm({ calendar, slug, timeSlotId, when, onCreated }: BookingFormProps) {
    const createBookingMutation = useCreateBooking(slug, when.getFullYear(), when.getMonth() + 1);

    const [formState, setFormState] = useState<BookingFormState>(() =>
        createInitialState(calendar.topics[0] ?? '')
    );

    const topicOptions = useMemo(
        () => calendar.topics.map((topic) => ({ value: topic, label: topic })),
        [calendar.topics]
    );

    const updateField = useCallback(
        <K extends keyof BookingFormState>(field: K, value: BookingFormState[K]) => {
            setFormState((prev) => ({ ...prev, [field]: value }));
        },
        []
    );

    const handleSubmit = useCallback(
        (event: React.FormEvent) => {
            event.preventDefault();
            const { topic, description, meetingType, location, meetingLink } = formState;

            createBookingMutation.mutate({
                timeSlotId,
                topic,
                description,
                when: formatDateToISO(when),
                meetingType,
                location: meetingType === 'OFFLINE' ? location : undefined,
                meetingLink: meetingType === 'ONLINE' ? meetingLink : undefined,
            });
        },
        [formState, timeSlotId, when, createBookingMutation]
    );

    useEffect(() => {
        if (createBookingMutation.isSuccess) {
            onCreated();
        }
    }, [createBookingMutation.isSuccess, onCreated]);

    const { topic, description, meetingType, location, meetingLink } = formState;
    const { isPending, isError, isSuccess, error } = createBookingMutation;

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <fieldset className="flex flex-col gap-1">
                <label className="block text-sm font-semibold text-[var(--cohi-text-dark)] mb-2">
                    주제
                </label>
                <Select
                    value={topic}
                    onValueChange={(value) => updateField('topic', value)}
                    options={topicOptions}
                    data-testid="booking-topic-select"
                />
            </fieldset>

            <MeetingTypeSelector
                value={meetingType}
                onChange={(value) => updateField('meetingType', value)}
                location={location}
                onLocationChange={(value) => updateField('location', value)}
                meetingLink={meetingLink}
                onMeetingLinkChange={(value) => updateField('meetingLink', value)}
            />

            <fieldset className="flex flex-col gap-1">
                <label htmlFor="description" className="block text-sm font-semibold text-[var(--cohi-text-dark)] mb-2">
                    설명
                </label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => updateField('description', e.target.value)}
                    data-testid="booking-description-textarea"
                    placeholder="이야기하고 싶은 내용을 자유롭게 적어주세요"
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-[var(--cohi-text-dark)] resize-none focus:outline-none focus:border-[var(--cohi-primary)] focus:ring-1 focus:ring-[var(--cohi-primary)]"
                />
            </fieldset>

            <Button variant="primary" type="submit" disabled={isPending} size="lg" className="w-full">
                {isPending ? '예약 신청 중...' : '예약 신청하기'}
            </Button>

            {isError && (
                <p data-testid="booking-error" className="text-sm text-red-500">
                    {error.message}
                </p>
            )}

            {isSuccess && (
                <p data-testid="booking-success" className="text-green-600 text-sm">
                    예약 생성 완료!
                </p>
            )}
        </form>
    );
}
