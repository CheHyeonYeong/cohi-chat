/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import TimeSlotSettings from './TimeSlotSettings';
import {
    useCreateTimeslot,
    useDeleteTimeslot,
    useMyCalendar,
    useMyTimeslots,
} from '~/features/host';
import { useAuth, useUpdateProfile } from '~/features/member';
import { useHost } from '~/hooks/useHost';

const { mockShowToast } = vi.hoisted(() => ({
    mockShowToast: vi.fn(),
}));

vi.mock('~/components/header', () => ({
    Header: () => <div data-testid="header" />,
}));

vi.mock('~/components/toast/useToast', () => ({
    useToast: () => ({ showToast: mockShowToast }),
}));

vi.mock('~/features/host/components/timeslot/TimeSlotForm', () => ({
    default: ({ onOverlapDetected }: { onOverlapDetected?: () => void }) => (
        <button type="button" onClick={() => onOverlapDetected?.()}>
            trigger-form-overlap
        </button>
    ),
}));

vi.mock('~/features/host/components/timeslot/WeeklySchedulePreview', () => ({
    default: ({
        onDuplicateBlocked,
    }: {
        onDuplicateBlocked?: (entry: { weekdays: number[]; startTime: string; endTime: string }) => void;
    }) => (
        <button
            type="button"
            onClick={() => onDuplicateBlocked?.({ weekdays: [1], startTime: '09:00', endTime: '10:00' })}
        >
            trigger-grid-duplicate
        </button>
    ),
}));

vi.mock('~/features/host', () => ({
    useCreateTimeslot: vi.fn(),
    useDeleteTimeslot: vi.fn(),
    useMyTimeslots: vi.fn(),
    useMyCalendar: vi.fn(),
}));

vi.mock('~/features/member', () => ({
    useAuth: vi.fn(),
    useUpdateProfile: vi.fn(),
}));

vi.mock('~/hooks/useHost', () => ({
    useHost: vi.fn(),
}));

beforeEach(() => {
    vi.clearAllMocks();
    mockShowToast.mockReset();

    vi.mocked(useAuth).mockReturnValue({
        data: { username: 'tester' },
    } as unknown as ReturnType<typeof useAuth>);

    vi.mocked(useHost).mockReturnValue({
        data: null,
    } as unknown as ReturnType<typeof useHost>);

    vi.mocked(useUpdateProfile).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
    } as unknown as ReturnType<typeof useUpdateProfile>);

    vi.mocked(useMyTimeslots).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
    } as unknown as ReturnType<typeof useMyTimeslots>);

    vi.mocked(useMyCalendar).mockReturnValue({
        data: { calendarAccessible: true },
    } as unknown as ReturnType<typeof useMyCalendar>);

    vi.mocked(useCreateTimeslot).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
    } as unknown as ReturnType<typeof useCreateTimeslot>);

    vi.mocked(useDeleteTimeslot).mockReturnValue({
        mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof useDeleteTimeslot>);
});

describe('TimeSlotSettings duplicate blocked toast', () => {
    it('calls toast when duplicate slot creation is blocked', () => {
        render(<TimeSlotSettings />);

        fireEvent.click(screen.getByRole('button', { name: 'trigger-grid-duplicate' }));

        expect(mockShowToast).toHaveBeenCalledTimes(1);
    });
});
