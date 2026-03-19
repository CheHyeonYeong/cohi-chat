import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useLogin } from './useLogin';
import { loginApi } from '../api/memberApi';
import { saveAuthTokens } from '../utils/authStorage';

vi.mock('../api/memberApi', () => ({
    loginApi: vi.fn(),
}));

vi.mock('../utils/authStorage', () => ({
    saveAuthTokens: vi.fn(),
}));

describe('useLogin', () => {
    const createWrapper = () => {
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });

        return ({ children }: { children: ReactNode }) =>
            createElement(QueryClientProvider, { client: queryClient }, children);
    };

    beforeEach(() => {
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
        expect(saveAuthTokens).toHaveBeenCalledWith(response);
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
