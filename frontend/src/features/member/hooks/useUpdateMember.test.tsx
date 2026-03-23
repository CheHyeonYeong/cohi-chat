import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useUpdateMember } from './useUpdateMember';

const mockUpdateMemberApi = vi.fn();

vi.mock('../api/memberApi', () => ({
    updateMemberApi: (...args: unknown[]) => mockUpdateMemberApi(...args),
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('useUpdateMember', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('displayName 업데이트 시 updateMemberApi를 올바른 인자로 호출한다', async () => {
        const mockResponse = {
            id: 'test-id',
            username: 'testuser',
            displayName: 'New Name',
            email: 'test@example.com',
            role: 'GUEST',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
        };
        mockUpdateMemberApi.mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useUpdateMember('testuser'), {
            wrapper: createWrapper(),
        });

        result.current.mutate({ displayName: 'New Name' });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(mockUpdateMemberApi).toHaveBeenCalledWith('testuser', { displayName: 'New Name' });
    });

    it('password 업데이트 시 updateMemberApi를 올바른 인자로 호출한다', async () => {
        const mockResponse = {
            id: 'test-id',
            username: 'testuser',
            displayName: 'Test User',
            email: 'test@example.com',
            role: 'GUEST',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
        };
        mockUpdateMemberApi.mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useUpdateMember('testuser'), {
            wrapper: createWrapper(),
        });

        result.current.mutate({ password: 'newPassword1!' });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(mockUpdateMemberApi).toHaveBeenCalledWith('testuser', {
            password: 'newPassword1!',
        });
    });

    it('API 에러 시 isError가 true가 된다', async () => {
        mockUpdateMemberApi.mockRejectedValue(new Error('서버 오류'));

        const { result } = renderHook(() => useUpdateMember('testuser'), {
            wrapper: createWrapper(),
        });

        result.current.mutate({ displayName: 'New Name' });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(result.current.error?.message).toBe('서버 오류');
    });
});
