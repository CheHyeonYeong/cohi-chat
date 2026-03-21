import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { Home } from './Home';

const { mockNavigate, mockScrollIntoView } = vi.hoisted(() => ({
    mockNavigate: vi.fn(),
    mockScrollIntoView: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
    useNavigate: () => mockNavigate,
}));

const mockUseHosts = vi.fn();
vi.mock('~/hooks/useHost', () => ({
    useHosts: () => mockUseHosts(),
}));

const mockUseAuth = vi.fn();
vi.mock('~/features/member', () => ({
    useAuth: () => mockUseAuth(),
}));

vi.mock('~/components/header', () => ({
    Header: () => <div data-testid="header" />,
}));

vi.mock('~/features/host', () => ({
    HostCard: ({ displayName }: { displayName: string }) => <div data-testid="host-card">{displayName}</div>,
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        data: null,
    });
    mockUseHosts.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
    });
    vi.spyOn(document, 'getElementById').mockReturnValue({
        scrollIntoView: mockScrollIntoView,
    } as unknown as HTMLElement);
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('Home', () => {
    it('renders host cards from host data', () => {
        mockUseHosts.mockReturnValue({
            data: [
                { username: 'alice', displayName: 'Alice', chatCount: 3 },
                { username: 'bob', displayName: 'Bob', chatCount: 0 },
            ],
            isLoading: false,
            error: null,
        });

        render(<Home />, { wrapper: createWrapper() });

        expect(screen.getAllByTestId('host-card')).toHaveLength(2);
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('renders host loading errors', () => {
        mockUseHosts.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: { message: 'host load failed' },
        });

        render(<Home />, { wrapper: createWrapper() });

        expect(screen.getByText('host load failed')).toBeInTheDocument();
    });

    it('navigates to login when unauthenticated user clicks the CTA', async () => {
        render(<Home />, { wrapper: createWrapper() });

        await userEvent.click(screen.getByRole('button'));

        expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' });
        expect(mockScrollIntoView).not.toHaveBeenCalled();
    });

    it('scrolls to the host list when authenticated user clicks the CTA', async () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isLoading: false,
            data: { username: 'guest', displayName: 'Guest' },
        });

        render(<Home />, { wrapper: createWrapper() });

        await userEvent.click(screen.getByRole('button'));

        expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('disables the CTA while auth status is loading', () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: false,
            isLoading: true,
            data: null,
        });

        render(<Home />, { wrapper: createWrapper() });

        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('does not navigate while auth status is loading', async () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: false,
            isLoading: true,
            data: null,
        });

        render(<Home />, { wrapper: createWrapper() });

        await userEvent.click(screen.getByRole('button'));

        expect(mockNavigate).not.toHaveBeenCalled();
        expect(mockScrollIntoView).not.toHaveBeenCalled();
    });
});
