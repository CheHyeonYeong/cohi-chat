import type { ComponentType, PropsWithChildren, ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Home } from './Home';

vi.mock('@tanstack/react-router', () => ({
    useNavigate: () => vi.fn(),
    Link: ({ children, to, ...props }: PropsWithChildren<Record<string, unknown>>) =>
        <a href={to as string} {...props}>{children}</a>,
    createLink:
        (component: ComponentType<Record<string, unknown>>) =>
            (props: Record<string, unknown>) => {
                const { to, ...rest } = props;
                const Component = component;
                return <Component href={to} {...rest} />;
            },
    useRouterState: () => ({ location: { pathname: '/' } }),
}));

const mockUseHostDirectory = vi.fn();
vi.mock('~/features/host', async (importOriginal) => {
    const actual = await importOriginal() as Record<string, unknown>;
    return {
        ...actual,
        useMyCalendar: () => ({ data: null, isLoading: false }),
        useHostDirectory: (query: string) => mockUseHostDirectory(query),
    };
});

const mockUseAuth = vi.fn();
vi.mock('~/features/member', () => ({
    useAuth: () => mockUseAuth(),
    useLogout: () => ({ logout: vi.fn() }),
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    return ({ children }: { children: ReactNode }) =>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
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
        mockUseHostDirectory.mockReturnValue({ data: hosts, isLoading: false, error: null });

        render(<Home />, { wrapper: createWrapper() });

        const img = screen.getByAltText('Alice');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', 'https://example.com/alice.jpg');
    });

    it('profileImageUrl이 없으면 이름 첫 글자를 표시한다', () => {
        mockUseHostDirectory.mockReturnValue({
            data: [{ username: 'bob', displayName: 'Bob', chatCount: 0 }],
            isLoading: false,
            error: null,
        });

        render(<Home />, { wrapper: createWrapper() });

        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('job이 없으면 "호스트"를 기본값으로 표시한다', () => {
        mockUseHostDirectory.mockReturnValue({
            data: [{ username: 'charlie', displayName: 'Charlie', chatCount: 0 }],
            isLoading: false,
            error: null,
        });

        render(<Home />, { wrapper: createWrapper() });

        expect(screen.getByText('호스트')).toBeInTheDocument();
    });

    it('chatCount > 0이면 배지를 표시한다', () => {
        mockUseHostDirectory.mockReturnValue({ data: hosts, isLoading: false, error: null });

        render(<Home />, { wrapper: createWrapper() });

        expect(screen.getByText('3회')).toBeInTheDocument();
    });

    it('chatCount가 0이면 배지를 표시하지 않는다', () => {
        mockUseHostDirectory.mockReturnValue({
            data: [{ username: 'dave', displayName: 'Dave', job: '디자이너', chatCount: 0 }],
            isLoading: false,
            error: null,
        });

        render(<Home />, { wrapper: createWrapper() });

        expect(screen.queryByText('0회')).not.toBeInTheDocument();
    });

    it('일반 URL의 이미지가 정상 렌더링된다', () => {
        mockUseHostDirectory.mockReturnValue({
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

describe('Home - 호스트 검색 UI', () => {
    const defaultHosts = [
        {
            username: 'alice',
            displayName: 'Alice',
            job: '백엔드 개발자',
            chatCount: 3,
        },
    ];
    const searchHosts = [
        {
            username: 'mentor',
            displayName: 'Mentor Kim',
            job: '커리어 멘토',
            chatCount: 1,
        },
    ];

    it('검색 input을 렌더링한다', () => {
        mockUseHostDirectory.mockReturnValue({ data: defaultHosts, isLoading: false, error: null });

        render(<Home />, { wrapper: createWrapper() });

        expect(screen.getByTestId('host-search-input')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('직무, 주제, 소개로 검색해 보세요')).toBeInTheDocument();
    });

    it('검색어를 입력하면 검색 결과로 전환되고, 비우면 기존 목록으로 돌아간다', async () => {
        const user = userEvent.setup();
        mockUseHostDirectory.mockImplementation((query: string) => (query.trim().length > 0
            ? { data: searchHosts, isLoading: false, error: null }
            : { data: defaultHosts, isLoading: false, error: null }));

        render(<Home />, { wrapper: createWrapper() });

        expect(screen.getByText('Alice')).toBeInTheDocument();

        await user.type(screen.getByTestId('host-search-input'), '백엔');

        expect(screen.getByText('Mentor Kim')).toBeInTheDocument();
        expect(screen.queryByText('Alice')).not.toBeInTheDocument();
        expect(screen.getByTestId('host-search-summary')).toHaveTextContent('"백엔" 검색 결과 1명');

        await user.clear(screen.getByTestId('host-search-input'));

        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.queryByText('Mentor Kim')).not.toBeInTheDocument();
        expect(screen.queryByTestId('host-search-summary')).not.toBeInTheDocument();
    });

    it('검색 결과가 없으면 검색 전용 빈 상태 메시지를 표시한다', async () => {
        const user = userEvent.setup();
        mockUseHostDirectory.mockImplementation((query: string) => (query.trim().length > 0
            ? { data: [], isLoading: false, error: null }
            : { data: defaultHosts, isLoading: false, error: null }));

        render(<Home />, { wrapper: createWrapper() });

        await user.type(screen.getByTestId('host-search-input'), '포트폴리오');

        expect(screen.getByTestId('host-search-summary')).toHaveTextContent('"포트폴리오" 검색 결과 0명');
        expect(screen.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
    });
});

describe('Home - 호스트 목록 상태', () => {
    it('기본 목록 로딩 중이면 기본 로딩 메시지를 표시한다', () => {
        mockUseHostDirectory.mockReturnValue({ data: undefined, isLoading: true, error: null });

        render(<Home />, { wrapper: createWrapper() });

        expect(screen.getByText('읽어오는 중...')).toBeInTheDocument();
    });

    it('호스트가 없으면 기본 빈 목록 메시지를 표시한다', () => {
        mockUseHostDirectory.mockReturnValue({ data: [], isLoading: false, error: null });

        render(<Home />, { wrapper: createWrapper() });

        expect(screen.getByText('등록된 호스트가 없습니다.')).toBeInTheDocument();
    });

    it('에러가 발생하면 에러 메시지를 표시한다', () => {
        mockUseHostDirectory.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: new Error('네트워크 오류'),
        });

        render(<Home />, { wrapper: createWrapper() });

        expect(screen.getByText('네트워크 오류')).toBeInTheDocument();
    });
});
