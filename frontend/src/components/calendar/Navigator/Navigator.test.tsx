import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Navigator } from './Navigator';

describe('Navigator', () => {
    const defaultProps = {
        username: 'test-host',
        year: 2024,
        month: 6,
        onPrevious: vi.fn(),
        onNext: vi.fn(),
    };

    describe('날짜 표시', () => {
        it('현재 년월을 표시한다', () => {
            render(<Navigator {...defaultProps} />);

            expect(screen.getByRole('label')).toHaveTextContent('2024년 6월');
        });
    });

    describe('이전 달 이동', () => {
        it('이전 달로 이동할 수 있다', async () => {
            const onPrevious = vi.fn();
            const baseDate = new Date(2024, 0, 1);
            render(
                <Navigator
                    {...defaultProps}
                    year={2024}
                    month={6}
                    baseDate={baseDate}
                    onPrevious={onPrevious}
                />,
            );

            const prevButton = screen.getByRole('button', { name: /</i });
            await userEvent.click(prevButton);

            expect(onPrevious).toHaveBeenCalledWith('test-host', { year: 2024, month: 5 });
        });

        it('1월에서 이전 달로 이동하면 전년도 12월이 된다', async () => {
            const onPrevious = vi.fn();
            const baseDate = new Date(2023, 0, 1);
            render(
                <Navigator
                    {...defaultProps}
                    year={2024}
                    month={1}
                    baseDate={baseDate}
                    onPrevious={onPrevious}
                />,
            );

            const prevButton = screen.getByRole('button', { name: /</i });
            await userEvent.click(prevButton);

            expect(onPrevious).toHaveBeenCalledWith('test-host', { year: 2023, month: 12 });
        });

        it('현재 월 이전으로는 이동할 수 없다', async () => {
            const onPrevious = vi.fn();
            const baseDate = new Date(2024, 5, 15);
            render(
                <Navigator
                    {...defaultProps}
                    year={2024}
                    month={6}
                    baseDate={baseDate}
                    onPrevious={onPrevious}
                />,
            );

            const prevButton = screen.getByRole('button', { name: /</i });
            await userEvent.click(prevButton);

            expect(onPrevious).not.toHaveBeenCalled();
        });
    });

    describe('다음 달 이동', () => {
        it('다음 달로 이동할 수 있다', async () => {
            const onNext = vi.fn();
            render(<Navigator {...defaultProps} onNext={onNext} />);

            const nextButton = screen.getByRole('button', { name: />/i });
            await userEvent.click(nextButton);

            expect(onNext).toHaveBeenCalledWith('test-host', { year: 2024, month: 7 });
        });

        it('12월에서 다음 달로 이동하면 다음 해 1월이 된다', async () => {
            const onNext = vi.fn();
            render(<Navigator {...defaultProps} month={12} onNext={onNext} />);

            const nextButton = screen.getByRole('button', { name: />/i });
            await userEvent.click(nextButton);

            expect(onNext).toHaveBeenCalledWith('test-host', { year: 2025, month: 1 });
        });
    });
});
