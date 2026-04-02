import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useHostDirectory, useHostSearch } from './useHostSearch';
import { hostKeys } from './queryKeys';
import { searchHosts } from '../api';

const mockUseHosts = vi.fn();

vi.mock('~/hooks/useHost', () => ({
    useHosts: (enabled?: boolean) => mockUseHosts(enabled),
}));

vi.mock('../api', () => ({
    searchHosts: vi.fn(),
}));

describe('useHostSearch', () => {
    let queryClient: QueryClient;

    const createWrapper = () => ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
            },
        });
        vi.clearAllMocks();
        mockUseHosts.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: null,
        });
    });

    it('빈 검색어면 검색 API를 호출하지 않는다', () => {
        const { result } = renderHook(() => useHostSearch('   '), {
            wrapper: createWrapper(),
        });

        expect(result.current.fetchStatus).toBe('idle');
        expect(searchHosts).not.toHaveBeenCalled();
    });

    it('검색어를 trim해서 검색 API를 호출한다', async () => {
        const hosts = [
            {
                id: 'host-1',
                username: 'mentor',
                displayName: 'Mentor Kim',
                job: '커리어 멘토',
                chatCount: 2,
            },
        ];
        vi.mocked(searchHosts).mockResolvedValue(hosts);

        const { result } = renderHook(() => useHostSearch('  취준 백엔  '), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(searchHosts).toHaveBeenCalledWith('취준 백엔');
        expect(queryClient.getQueryData(hostKeys.search('취준 백엔'))).toEqual(hosts);
    });

    it('빈 검색어면 기본 목록 훅 결과를 그대로 반환한다', () => {
        const defaultHosts = [
            {
                id: 'host-1',
                username: 'alice',
                displayName: 'Alice',
                job: '백엔드 개발자',
                chatCount: 3,
            },
        ];
        mockUseHosts.mockReturnValue({
            data: defaultHosts,
            isLoading: false,
            error: null,
        });

        const { result } = renderHook(() => useHostDirectory('   '), {
            wrapper: createWrapper(),
        });

        expect(mockUseHosts).toHaveBeenCalledWith(true);
        expect(result.current.data).toEqual(defaultHosts);
        expect(searchHosts).not.toHaveBeenCalled();
    });

    it('검색어가 있으면 검색 결과 훅을 반환한다', async () => {
        const searchedHosts = [
            {
                id: 'host-2',
                username: 'mentor',
                displayName: 'Mentor Kim',
                job: '커리어 멘토',
                chatCount: 1,
            },
        ];
        vi.mocked(searchHosts).mockResolvedValue(searchedHosts);

        const { result } = renderHook(() => useHostDirectory('이직 상담'), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(mockUseHosts).toHaveBeenCalledWith(false);
        expect(searchHosts).toHaveBeenCalledWith('이직 상담');
        expect(result.current.data).toEqual(searchedHosts);
    });
});
