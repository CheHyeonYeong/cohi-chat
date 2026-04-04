import type { FormEvent } from 'react';
import { getErrorMessage } from '~/libs/errorUtils';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '~/components/button';
import { Select } from '~/components/select';
import type { IBookingDetail, MeetingType } from '../../types';
import { MeetingTypeSelector } from '../MeetingTypeSelector';
import { useUpdateBooking } from '../../hooks/useUpdateBooking';
import { formatDateToISO } from '~/libs/date';

interface BookingEditFormProps {
    booking: IBookingDetail;
    topics: string[];
    onCancel: () => void;
    onSuccess: () => void;
}

interface EditFormState {
    topic: string;
    description: string;
    meetingType: MeetingType;
    location: string;
    meetingLink: string;
}

export const BookingEditForm = ({ booking, topics, onCancel, onSuccess }: BookingEditFormProps) => {
    const updateMutation = useUpdateBooking(booking.id);

    const [formState, setFormState] = useState<EditFormState>(() => ({
        topic: booking.topic,
        description: booking.description ?? '',
        meetingType: booking.meetingType,
        location: booking.location ?? '',
        meetingLink: booking.meetingLink ?? '',
    }));

    const topicOptions = useMemo(
        () => topics.map((topic) => ({ value: topic, label: topic })),
        [topics]
    );

    const updateField = useCallback(
        <K extends keyof EditFormState>(field: K, value: EditFormState[K]) => {
            setFormState((prev) => ({ ...prev, [field]: value }));
        },
        []
    );

    const handleSubmit = useCallback(
        (event: FormEvent) => {
            event.preventDefault();
            const { topic, description, meetingType, location, meetingLink } = formState;

            updateMutation.mutate(
                {
                    timeSlotId: booking.timeSlot.id,
                    when: formatDateToISO(booking.startedAt),
                    topic,
                    description,
                    meetingType,
                    location: meetingType === 'OFFLINE' ? location : undefined,
                    meetingLink: meetingType === 'ONLINE' ? meetingLink : undefined,
                },
                {
                    onSuccess: () => onSuccess(),
                }
            );
        },
        [formState, booking, updateMutation, onSuccess]
    );

    const { topic, description, meetingType, location, meetingLink } = formState;
    const { isPending, isError, error } = updateMutation;

    return (
        <form onSubmit={handleSubmit} data-testid="booking-edit-form" className="flex flex-col gap-4">
            <fieldset className="flex flex-col gap-1">
                <label className="block text-sm font-semibold text-cohi-text-dark mb-2">
                    주제
                </label>
                <Select
                    value={topic}
                    onValueChange={(value) => updateField('topic', value)}
                    options={topicOptions}
                    data-testid="booking-edit-topic-select"
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
                <label htmlFor="edit-description" className="block text-sm font-semibold text-cohi-text-dark mb-2">
                    설명
                </label>
                <textarea
                    id="edit-description"
                    value={description}
                    onChange={(e) => updateField('description', e.target.value)}
                    data-testid="booking-edit-description-textarea"
                    placeholder="이야기하고 싶은 내용을 자유롭게 적어주세요"
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-cohi-text-dark resize-none focus:outline-none focus:border-cohi-primary focus:ring-1 focus:ring-cohi-primary"
                />
            </fieldset>

            {isError && (
                <p data-testid="booking-edit-error" className="text-sm text-red-500">
                    {getErrorMessage(error)}
                </p>
            )}

            <div className="flex gap-3">
                <Button variant="primary" type="submit" disabled={isPending} data-testid="booking-edit-save-button">
                    {isPending ? '저장 중...' : '저장'}
                </Button>
                <Button variant="secondary" type="button" onClick={onCancel} data-testid="booking-edit-cancel-button">
                    취소
                </Button>
            </div>
        </form>
    );
};
