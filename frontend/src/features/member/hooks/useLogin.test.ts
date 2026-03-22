import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useLogin } from './useLogin';
import { loginApi } from '../api/memberApi';
import { saveAuthenticatedUser } from '../utils/authStorage';
import { bookingKeys } from '../../booking/hooks/queryKeys';

vi.mock('../api/memberApi', () => ({
    loginApi: vi.fn(),
}));

vi.mock('../utils/authStorage', () => ({
    saveAuthenticatedUser: vi.fn(),
}));

describe('useLogin', () => {
    let queryClient: QueryClient;

    const createWrapper = () => ({ children }: { children: ReactNode }) =>
        createElement(QueryClientProvider, { client: queryClient }, children);

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('saves auth tokens on successful login', async () => {
        const response = {
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            expiredInMinutes: 60,
            username: 'tester',
            displayName: 'Tester',
        };
        vi.mocked(loginApi).mockResolvedValue(response);

        const { result } = renderHook(() => useLogin(), {
            wrapper: createWrapper(),
        });

        await result.current.mutateAsync({
            username: 'tester',
            password: 'password',
        });

        expect(loginApi).toHaveBeenCalledWith({
            username: 'tester',
            password: 'password',
        });
        expect(saveAuthenticatedUser).toHaveBeenCalledTimes(1);
    });

    it('clears booking caches on login', async () => {
        const response = {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
            expiredInMinutes: 60,
            username: 'bob',
            displayName: 'Bob',
        };
        vi.mocked(loginApi).mockResolvedValue(response);

        queryClient.setQueryData(bookingKeys.myBookings(1, 10, 'alice'), { bookings: [{ id: 1 }], totalCount: 1 });
        queryClient.setQueryData(bookingKeys.booking(1, 'alice'), { id: 1, topic: 'Alice booking' });

        const { result } = renderHook(() => useLogin(), {
            wrapper: createWrapper(),
        });

        await result.current.mutateAsync({ username: 'bob', password: 'secret' });

        await waitFor(() => {
            expect(saveAuthenticatedUser).toHaveBeenCalledTimes(1);
        });

        expect(queryClient.getQueryData(bookingKeys.myBookings(1, 10, 'alice'))).toBeUndefined();
        expect(queryClient.getQueryData(bookingKeys.booking(1, 'alice'))).toBeUndefined();
    });

    it('clears previously cached booking data on repeated account switches', async () => {
        const bobResponse = {
            accessToken: 'bob-access-token',
            refreshToken: 'bob-refresh-token',
            expiredInMinutes: 60,
            username: 'bob',
            displayName: 'Bob',
        };
        const aliceResponse = {
            accessToken: 'alice-access-token',
            refreshToken: 'alice-refresh-token',
            expiredInMinutes: 60,
            username: 'alice',
            displayName: 'Alice',
        };

        vi.mocked(loginApi)
            .mockResolvedValueOnce(bobResponse)
            .mockResolvedValueOnce(aliceResponse);

        const { result } = renderHook(() => useLogin(), {
            wrapper: createWrapper(),
        });

        queryClient.setQueryData(bookingKeys.myBookings(1, 10, 'alice'), { bookings: [{ id: 1 }], totalCount: 1 });
        queryClient.setQueryData(bookingKeys.booking(1, 'alice'), { id: 1, topic: 'Alice booking' });

        await result.current.mutateAsync({ username: 'bob', password: 'secret' });

        expect(queryClient.getQueryData(bookingKeys.myBookings(1, 10, 'alice'))).toBeUndefined();
        expect(queryClient.getQueryData(bookingKeys.booking(1, 'alice'))).toBeUndefined();

        queryClient.setQueryData(bookingKeys.myBookings(1, 10, 'bob'), { bookings: [{ id: 2 }], totalCount: 1 });
        queryClient.setQueryData(bookingKeys.booking(2, 'bob'), { id: 2, topic: 'Bob booking' });

        await result.current.mutateAsync({ username: 'alice', password: 'secret' });

        await waitFor(() => {
            expect(saveAuthenticatedUser).toHaveBeenCalledTimes(2);
        });

        expect(queryClient.getQueryData(bookingKeys.myBookings(1, 10, 'bob'))).toBeUndefined();
        expect(queryClient.getQueryData(bookingKeys.booking(2, 'bob'))).toBeUndefined();
    });

    it('does not write console.error for expected login failures', async () => {
        const error = new Error('아이디 또는 비밀번호가 올바르지 않습니다.', { cause: 401 });
        vi.mocked(loginApi).mockRejectedValue(error);
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const { result } = renderHook(() => useLogin(), {
            wrapper: createWrapper(),
        });

        await expect(
            result.current.mutateAsync({
                username: 'tester',
                password: 'wrong-password',
            })
        ).rejects.toThrow('아이디 또는 비밀번호가 올바르지 않습니다.');

        expect(consoleErrorSpy).not.toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    });

    it('does not write console.error when mutate handles expected login failures', async () => {
        const error = new Error('invalid credentials', { cause: 401 });
        vi.mocked(loginApi).mockRejectedValue(error);
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const { result } = renderHook(() => useLogin(), {
            wrapper: createWrapper(),
        });

        result.current.mutate({
            username: 'tester',
            password: 'wrong-password',
        });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(consoleErrorSpy).not.toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    });
});
