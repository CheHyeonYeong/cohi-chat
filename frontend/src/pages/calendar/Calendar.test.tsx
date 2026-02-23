/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
    Link: ({ children, to, className }: { children: React.ReactNode; to: string; className?: string }) => (
        <a href={to} className={className}>{children}</a>
    ),
    useSearch: () => ({ year: 2024, month: 1 }),
    useParams: () => ({ slug: 'testuser' }),
    useNavigate: () => vi.fn(),
}));

// Mock useHost hook
vi.mock('~/hooks/useHost', () => ({
    useHost: (username: string) => ({
        data: username === 'testuser' ? { username: 'testuser', displayName: 'Test User Display' } : null,
        isLoading: false,
        isError: false,
    }),
    useHosts: () => ({
        data: [{ username: 'testuser', displayName: 'Test User Display' }],
        isLoading: false,
    }),
}));

// Mock calendar features
vi.mock('~/features/calendar', () => ({
    Body: () => <div data-testid="calendar-body">Body</div>,
    Navigator: () => <div data-testid="calendar-navigator">Navigator</div>,
    Timeslots: () => <div data-testid="calendar-timeslots">Timeslots</div>,
    BookingForm: () => <div data-testid="booking-form">BookingForm</div>,
    getCalendarDays: () => [],
    useCalendarEvent: () => ({ id: 1, name: 'Test Calendar' }),
    useCalendarNavigation: () => ({ handlePrevious: vi.fn(), handleNext: vi.fn() }),
    useTimeslots: () => ({ data: [] }),
    useBookings: () => ({ data: [], refetch: vi.fn() }),
    useBookingsStreamQuery: () => [],
}));

// Mock useAuth
vi.mock('~/features/member', () => ({
    useAuth: () => ({
        isError: false,
        isLoading: false,
        data: { username: 'guest' },
    }),
}));

import Calendar from './Calendar';

describe('Calendar', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
            },
        });
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('should display host displayName instead of username', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <Calendar />
            </QueryClientProvider>
        );

        // displayName이 표시되어야 함
        const heading = screen.getByRole('heading', { level: 2 });
        expect(heading.textContent).toContain('Test User Display');
        expect(heading.textContent).not.toContain('testuser');
        expect(heading.textContent).toContain('님과 약속잡기');
    });

    it('should fallback to slug when host has no displayName', () => {
        // useHost mock을 displayName 없는 상태로 변경
        vi.doMock('~/hooks/useHost', () => ({
            useHost: () => ({
                data: { username: 'testuser', displayName: null },
                isLoading: false,
                isError: false,
            }),
            useHosts: () => ({ data: [], isLoading: false }),
        }));

        render(
            <QueryClientProvider client={queryClient}>
                <Calendar />
            </QueryClientProvider>
        );

        const heading = screen.getByRole('heading', { level: 2 });
        // displayName이 null이면 slug가 fallback으로 표시
        expect(heading.textContent).toContain('님과 약속잡기');
    });
});
