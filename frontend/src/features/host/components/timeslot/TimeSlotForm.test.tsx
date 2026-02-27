/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import TimeSlotForm, { type TimeSlotEntry } from './TimeSlotForm';

describe('TimeSlotForm', () => {
    afterEach(() => {
        cleanup();
    });

    const createBaseProps = (entries: TimeSlotEntry[]) => ({
        entries,
        onChange: vi.fn(),
        onSave: vi.fn(),
        isPending: false,
        errors: {},
    });

    it('shows overlap error when entries overlap in weekday and time', () => {
        const entries: TimeSlotEntry[] = [
            { weekdays: [1], startTime: '09:00', endTime: '12:00' },
            { weekdays: [1], startTime: '10:00', endTime: '11:00' },
        ];

        const { container } = render(<TimeSlotForm {...createBaseProps(entries)} />);
        const overlapErrors = container.querySelectorAll('[data-testid="overlap-error"]');

        expect(overlapErrors.length).toBeGreaterThan(0);
    });

    it('does not show overlap error when weekdays do not overlap', () => {
        const entries: TimeSlotEntry[] = [
            { weekdays: [1], startTime: '09:00', endTime: '12:00' },
            { weekdays: [2], startTime: '10:00', endTime: '11:00' },
        ];

        const { container } = render(<TimeSlotForm {...createBaseProps(entries)} />);
        const overlapErrors = container.querySelectorAll('[data-testid="overlap-error"]');

        expect(overlapErrors.length).toBe(0);
    });

    it('disables save button when there is overlap', () => {
        const entries: TimeSlotEntry[] = [
            { weekdays: [1], startTime: '09:00', endTime: '12:00' },
            { weekdays: [1], startTime: '10:00', endTime: '11:00' },
        ];

        const { container } = render(<TimeSlotForm {...createBaseProps(entries)} />);
        const saveButton = container.querySelector('button.w-full.mt-6.rounded-lg');

        expect(saveButton).not.toBeNull();
        expect(saveButton).toBeDisabled();
    });

    it('calls overlap callback once when state changes into overlap', async () => {
        const onOverlapDetected = vi.fn();

        const { rerender } = render(
            <TimeSlotForm
                {...createBaseProps([
                    { weekdays: [1], startTime: '09:00', endTime: '12:00' },
                    { weekdays: [2], startTime: '10:00', endTime: '11:00' },
                ])}
                onOverlapDetected={onOverlapDetected}
            />,
        );

        rerender(
            <TimeSlotForm
                {...createBaseProps([
                    { weekdays: [1], startTime: '09:00', endTime: '12:00' },
                    { weekdays: [1], startTime: '10:00', endTime: '11:00' },
                ])}
                onOverlapDetected={onOverlapDetected}
            />,
        );

        await waitFor(() => expect(onOverlapDetected).toHaveBeenCalledTimes(1));
    });
});
