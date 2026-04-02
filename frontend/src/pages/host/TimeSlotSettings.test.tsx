/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TimeSlotSettings } from './TimeSlotSettings';
import {
    useCreateTimeslot,
    useDeleteTimeslot,
    useMyTimeslots,
    useUpdateTimeslot,
} from '~/features/host';
import type { TimeSlotResponse } from '~/features/host';
import { useAuth, useUpdateProfile } from '~/features/member';
import { useHost } from '~/hooks/useHost';
import type { TimeSlotEntry } from '~/features/host/components/timeslot/TimeSlotForm';

const {
    mockShowToast,
    mockDeleteTimeslotMutate,
    mockCreateTimeslotMutate,
    mockUpdateTimeslotMutate,
} = vi.hoisted(() => ({
    mockShowToast: vi.fn(),
    mockDeleteTimeslotMutate: vi.fn(),
    mockCreateTimeslotMutate: vi.fn(),
    mockUpdateTimeslotMutate: vi.fn(),
}));

vi.mock('~/components/header', () => ({
    Header: () => <div data-testid="header" />,
}));

vi.mock('~/components/toast/useToast', () => ({
    useToast: () => ({ showToast: mockShowToast }),
}));

vi.mock('~/features/host/components/timeslot/TimeSlotForm', () => ({
    TimeSlotForm: ({
        entries,
        onChange,
        onOverlapDetected,
        onSave,
    }: {
        entries: TimeSlotEntry[];
        onChange: (entries: TimeSlotEntry[]) => void;
        onOverlapDetected?: () => void;
        onSave: () => void;
    }) => (
        <>
            <div data-testid="form-entry-count">{entries.length}</div>
            <button type="button" onClick={() => onOverlapDetected?.()}>
                trigger-form-overlap
            </button>
            <button type="button" onClick={onSave}>
                trigger-save
            </button>
            <button
                type="button"
                onClick={() =>
                    onChange(
                        entries.map((entry) =>
                            entry.existingId === 101 ? { ...entry, startTime: '11:00', endTime: '12:00' } : entry,
                        ),
                    )
                }
            >
                trigger-edit-existing
            </button>
            <button
                type="button"
                onClick={() =>
                    onChange([
                        ...entries,
                        {
                            weekdays: [1],
                            startTime: '09:00',
                            endTime: '10:00',
                        },
                    ])
                }
            >
                trigger-add-entry
            </button>
        </>
    ),
}));

vi.mock('~/features/host/components/timeslot/WeeklySchedulePreview', () => ({
    WeeklySchedulePreview: ({
        entries,
        onDuplicateBlocked,
        onDeleteEntry,
    }: {
        entries: TimeSlotEntry[];
        onDuplicateBlocked?: (entry: { weekdays: number[]; startTime: string; endTime: string }) => void;
        onDeleteEntry?: (entry: TimeSlotEntry, index: number) => void;
    }) => (
        <>
            <button
                type="button"
                onClick={() => onDuplicateBlocked?.({ weekdays: [1], startTime: '09:00', endTime: '10:00' })}
            >
                trigger-grid-duplicate
            </button>
            <button
                type="button"
                disabled={!entries.some((entry) => entry.existingId != null)}
                onClick={() => {
                    const entryIndex = entries.findIndex((entry) => entry.existingId != null);
                    if (entryIndex < 0) return;
                    onDeleteEntry?.(entries[entryIndex], entryIndex);
                }}
            >
                trigger-grid-delete
            </button>
        </>
    ),
}));

vi.mock('~/features/host', () => ({
    useCreateTimeslot: vi.fn(),
    useUpdateTimeslot: vi.fn(),
    useDeleteTimeslot: vi.fn(),
    useMyTimeslots: vi.fn(),
}));

vi.mock('~/features/member', () => ({
    useAuth: vi.fn(),
    useUpdateProfile: vi.fn(),
}));

vi.mock('~/hooks/useHost', () => ({
    useHost: vi.fn(),
}));

const makeTimeslot = (overrides: Partial<TimeSlotResponse> = {}): TimeSlotResponse => ({
    id: 101,
    userId: 'tester',
    startedAt: '09:00:00',
    endedAt: '10:00:00',
    weekdays: [1],
    startDate: null,
    endDate: null,
    createdAt: '2026-03-11T00:00:00.000Z',
    updatedAt: '2026-03-11T00:00:00.000Z',
    ...overrides,
});

beforeEach(() => {
    vi.clearAllMocks();

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

    vi.mocked(useCreateTimeslot).mockReturnValue({
        mutateAsync: mockCreateTimeslotMutate,
        isPending: false,
    } as unknown as ReturnType<typeof useCreateTimeslot>);

    vi.mocked(useUpdateTimeslot).mockReturnValue({
        mutateAsync: mockUpdateTimeslotMutate,
        isPending: false,
    } as unknown as ReturnType<typeof useUpdateTimeslot>);

    vi.mocked(useDeleteTimeslot).mockReturnValue({
        mutateAsync: mockDeleteTimeslotMutate,
    } as unknown as ReturnType<typeof useDeleteTimeslot>);
});

describe('TimeSlotSettings duplicate blocked toast', () => {
    it('shows a duplicate toast when the preview reports overlap', () => {
        render(<TimeSlotSettings />);

        fireEvent.click(screen.getByRole('button', { name: 'trigger-grid-duplicate' }));

        expect(mockShowToast).toHaveBeenCalledTimes(1);
        expect(mockShowToast.mock.calls[0]?.[1]).toBe('duplicate-timeslot');
    });

    it('shows a duplicate toast when the form reports overlap', () => {
        render(<TimeSlotSettings />);

        fireEvent.click(screen.getByRole('button', { name: 'trigger-form-overlap' }));

        expect(mockShowToast).toHaveBeenCalledTimes(1);
        expect(mockShowToast.mock.calls[0]?.[1]).toBe('duplicate-timeslot');
    });
});

describe('TimeSlotSettings preview delete', () => {
    it('keeps persisted entry deletion pending until save', async () => {
        vi.mocked(useMyTimeslots).mockReturnValue({
            data: [makeTimeslot()],
            isLoading: false,
            error: null,
        } as unknown as ReturnType<typeof useMyTimeslots>);

        render(<TimeSlotSettings />);

        const deleteButton = screen.getByRole('button', { name: 'trigger-grid-delete' });
        await waitFor(() => expect(deleteButton).toBeEnabled());

        fireEvent.click(deleteButton);

        await waitFor(() => expect(screen.getByTestId('form-entry-count').textContent).toBe('0'));
        expect(mockDeleteTimeslotMutate).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'trigger-save' }));

        await waitFor(() => expect(mockDeleteTimeslotMutate).toHaveBeenCalledWith(101));
    });
});

describe('TimeSlotSettings save flow', () => {
    it('updates changed persisted entries on save', async () => {
        vi.mocked(useMyTimeslots).mockReturnValue({
            data: [makeTimeslot()],
            isLoading: false,
            error: null,
        } as unknown as ReturnType<typeof useMyTimeslots>);

        mockUpdateTimeslotMutate.mockResolvedValue(makeTimeslot({ startedAt: '11:00:00', endedAt: '12:00:00' }));

        render(<TimeSlotSettings />);

        fireEvent.click(screen.getByRole('button', { name: 'trigger-edit-existing' }));
        fireEvent.click(screen.getByRole('button', { name: 'trigger-save' }));

        await waitFor(() =>
            expect(mockUpdateTimeslotMutate).toHaveBeenCalledWith({
                id: 101,
                payload: {
                    startTime: '11:00:00',
                    endTime: '12:00:00',
                    weekdays: [1],
                },
            }),
        );
    });

    it('runs deletes before creating replacement entries', async () => {
        vi.mocked(useMyTimeslots).mockReturnValue({
            data: [makeTimeslot()],
            isLoading: false,
            error: null,
        } as unknown as ReturnType<typeof useMyTimeslots>);

        const callOrder: string[] = [];
        mockDeleteTimeslotMutate.mockImplementation(async () => {
            callOrder.push('delete');
        });
        mockCreateTimeslotMutate.mockImplementation(async () => {
            callOrder.push('create');
            return makeTimeslot({ id: 202 });
        });

        render(<TimeSlotSettings />);

        fireEvent.click(screen.getByRole('button', { name: 'trigger-grid-delete' }));
        await waitFor(() => expect(screen.getByTestId('form-entry-count').textContent).toBe('0'));

        fireEvent.click(screen.getByRole('button', { name: 'trigger-add-entry' }));
        fireEvent.click(screen.getByRole('button', { name: 'trigger-save' }));

        await waitFor(() => expect(mockDeleteTimeslotMutate).toHaveBeenCalledWith(101));
        await waitFor(() =>
            expect(mockCreateTimeslotMutate).toHaveBeenCalledWith({
                startTime: '09:00:00',
                endTime: '10:00:00',
                weekdays: [1],
            }),
        );
        expect(callOrder).toEqual(['delete', 'create']);
    });
});

describe('TimeSlotSettings loaded timeslots', () => {
    it('keeps the form empty when there are no existing timeslots', async () => {
        render(<TimeSlotSettings />);

        await waitFor(() => expect(screen.getByTestId('form-entry-count').textContent).toBe('0'));
    });

    it('accepts legacy startTime/endTime responses when loading existing entries', async () => {
        vi.mocked(useMyTimeslots).mockReturnValue({
            data: [
                {
                    ...makeTimeslot(),
                    startedAt: undefined as unknown as string,
                    endedAt: undefined as unknown as string,
                    startTime: '09:00:00',
                    endTime: '10:00:00',
                },
            ],
            isLoading: false,
            error: null,
        } as unknown as ReturnType<typeof useMyTimeslots>);

        render(<TimeSlotSettings />);

        await waitFor(() => expect(screen.getByRole('button', { name: 'trigger-grid-delete' })).toBeEnabled());
    });
});
