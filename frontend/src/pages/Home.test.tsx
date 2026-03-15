import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Home } from './Home';

vi.mock('@tanstack/react-router', () => ({
    useNavigate: () => vi.fn(),
    Link: ({ children, to, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
        React.createElement('a', { href: to, ...props }, children),
    createLink:
        (component: React.ComponentType<Record<string, unknown>>) =>
            (props: Record<string, unknown>) => {
                const { to, ...rest } = props;
                return React.createElement(component, { href: to, ...rest });
            },
    useRouterState: () => ({ location: { pathname: '/' } }),
}));

const mockUseHosts = vi.fn();
vi.mock('~/hooks/useHost', () => ({
    useHosts: () => mockUseHosts(),
}));

const mockUseAuth = vi.fn();
vi.mock('~/features/member', () => ({
    useAuth: () => mockUseAuth(),
    useLogout: () => ({ logout: vi.fn() }),
}));

vi.mock('~/features/host', async (importOriginal) => {
    const actual = await importOriginal() as Record<string, unknown>;
    return {
        ...actual,
        useMyCalendar: () => ({ data: null, isLoading: false }),
    };
});

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    return ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);
};

beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        data: null,
    });
});

afterEach(() => {
    cleanup();
});

describe('Home - HostCard', () => {
    const hosts = [
        {
            username: 'alice',
            displayName: 'Alice',
            job: '개발자',
            chatCount: 3,
            profileImageUrl: 'https://example.com/alice.jpg',
        },
    ];

    it('profileImageUrl이 있으면 img 태그를 렌더링한다', () => {
        mockUseHosts.mockReturnValue({ data: hosts, isLoading: false, error: null });

        render(<Home />, { wrapper: createWrapper() });

        const img = screen.getByAltText('Alice');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', 'https://example.com/alice.jpg');
    });

    it('profileImageUrl이 없으면 이름 첫 글자를 표시한다', () => {
        mockUseHosts.mockReturnValue({
            data: [{ username: 'bob', displayName: 'Bob', chatCount: 0 }],
            isLoading: false,
            error: null,
        });

        render(<Home />, { wrapper: createWrapper() });

        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('job이 없으면 "호스트"를 기본값으로 표시한다', () => {
        mockUseHosts.mockReturnValue({
            data: [{ username: 'charlie', displayName: 'Charlie', chatCount: 0 }],
            isLoading: false,
            error: null,
        });

        render(<Home />, { wrapper: createWrapper() });

        expect(screen.getByText('호스트')).toBeInTheDocument();
    });

    it('chatCount > 0이면 배지를 표시한다', () => {
        mockUseHosts.mockReturnValue({ data: hosts, isLoading: false, error: null });

        render(<Home />, { wrapper: createWrapper() });

        expect(screen.getByText('3회')).toBeInTheDocument();
    });

    it('chatCount가 0이면 배지를 표시하지 않는다', () => {
        mockUseHosts.mockReturnValue({
            data: [{ username: 'dave', displayName: 'Dave', job: '디자이너', chatCount: 0 }],
            isLoading: false,
            error: null,
        });

        render(<Home />, { wrapper: createWrapper() });

        expect(screen.queryByText('0회')).not.toBeInTheDocument();
    });

    it('isSafeUrl 없이도 일반 URL의 이미지가 정상 렌더링된다', () => {
        mockUseHosts.mockReturnValue({
            data: [
                {
                    username: 'eve',
                    displayName: 'Eve',
                    chatCount: 1,
                    profileImageUrl: 'https://cdn.example.com/photo.png',
                },
            ],
            isLoading: false,
            error: null,
        });

        render(<Home />, { wrapper: createWrapper() });

        const img = screen.getByAltText('Eve');
        expect(img).toHaveAttribute('src', 'https://cdn.example.com/photo.png');
    });
});

describe('Home - 호스트 목록 상태', () => {
    it('로딩 중이면 로딩 메시지를 표시한다', () => {
        mockUseHosts.mockReturnValue({ data: undefined, isLoading: true, error: null });

        render(<Home />, { wrapper: createWrapper() });

        expect(screen.getByText('읽어오는 중...')).toBeInTheDocument();
    });

    it('호스트가 없으면 빈 목록 메시지를 표시한다', () => {
        mockUseHosts.mockReturnValue({ data: [], isLoading: false, error: null });

        render(<Home />, { wrapper: createWrapper() });

        expect(screen.getByText('등록된 호스트가 없습니다.')).toBeInTheDocument();
    });

    it('에러가 발생하면 에러 메시지를 표시한다', () => {
        mockUseHosts.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: { message: '네트워크 오류' },
        });

        render(<Home />, { wrapper: createWrapper() });

        expect(screen.getByText('네트워크 오류')).toBeInTheDocument();
    });
});
