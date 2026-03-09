import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { ResetPasswordForm } from './ResetPasswordForm';

vi.mock('@tanstack/react-router', () => ({
    useNavigate: () => vi.fn(),
    useSearch: () => ({ token: 'valid-token' }),
    Link: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
        React.createElement('a', props, children),
}));

let mockVerifyResult: {
    isLoading: boolean;
    isTokenValid: boolean;
    isTokenInvalid: boolean;
} = {
    isLoading: false,
    isTokenValid: false,
    isTokenInvalid: false,
};

const mockConfirmMutate = vi.fn();
const mockConfirmMutation: {
    mutate: typeof mockConfirmMutate;
    isPending: boolean;
    isError: boolean;
    error: Error | null;
} = {
    mutate: mockConfirmMutate,
    isPending: false,
    isError: false,
    error: null,
};

vi.mock('../hooks/usePasswordReset', () => ({
    useVerifyResetToken: () => mockVerifyResult,
    useConfirmPasswordReset: () => mockConfirmMutation,
}));

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

describe('ResetPasswordForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockConfirmMutate.mockReset();
        mockVerifyResult = {
            isLoading: false,
            isTokenValid: false,
            isTokenInvalid: false,
        };
        mockConfirmMutation.isPending = false;
        mockConfirmMutation.isError = false;
        mockConfirmMutation.error = null;
    });

    it('토큰 검증 중 로딩 상태가 표시된다', () => {
        mockVerifyResult = { isLoading: true, isTokenValid: false, isTokenInvalid: false };

        render(<ResetPasswordForm />, { wrapper: createWrapper() });

        expect(screen.getByTestId('reset-password-verifying')).toBeInTheDocument();
        expect(screen.getByText('토큰을 확인하고 있습니다...')).toBeInTheDocument();
    });

    it('토큰이 유효하지 않으면 에러 메시지가 표시된다', () => {
        mockVerifyResult = { isLoading: false, isTokenValid: false, isTokenInvalid: true };

        render(<ResetPasswordForm />, { wrapper: createWrapper() });

        expect(screen.getByTestId('reset-password-invalid-token')).toBeInTheDocument();
        expect(screen.getByText(/유효하지 않거나 만료된 링크입니다/)).toBeInTheDocument();
    });

    it('토큰 검증 에러 시 에러 메시지가 표시된다', () => {
        mockVerifyResult = { isLoading: false, isTokenValid: false, isTokenInvalid: true };

        render(<ResetPasswordForm />, { wrapper: createWrapper() });

        expect(screen.getByTestId('reset-password-invalid-token')).toBeInTheDocument();
    });

    it('토큰이 유효하면 비밀번호 폼이 표시된다', () => {
        mockVerifyResult = { isLoading: false, isTokenValid: true, isTokenInvalid: false };

        render(<ResetPasswordForm />, { wrapper: createWrapper() });

        expect(screen.getByTestId('reset-password-form')).toBeInTheDocument();
        expect(screen.getByTestId('reset-password-input')).toBeInTheDocument();
        expect(screen.getByTestId('reset-password-confirm-input')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '비밀번호 변경' })).toBeInTheDocument();
    });

    it('유효한 비밀번호로 제출하면 confirmMutate가 호출된다', async () => {
        mockVerifyResult = { isLoading: false, isTokenValid: true, isTokenInvalid: false };

        render(<ResetPasswordForm />, { wrapper: createWrapper() });

        fireEvent.change(screen.getByTestId('reset-password-input'), {
            target: { value: 'validPass1!' },
        });
        fireEvent.change(screen.getByTestId('reset-password-confirm-input'), {
            target: { value: 'validPass1!' },
        });
        fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));

        await waitFor(() => {
            expect(mockConfirmMutate).toHaveBeenCalledWith(
                { token: 'valid-token', password: 'validPass1!' },
                expect.objectContaining({ onSuccess: expect.any(Function) }),
            );
        });
    });

    it('비밀번호가 비어있으면 validation 에러가 표시된다', () => {
        mockVerifyResult = { isLoading: false, isTokenValid: true, isTokenInvalid: false };

        render(<ResetPasswordForm />, { wrapper: createWrapper() });

        fireEvent.change(screen.getByTestId('reset-password-input'), {
            target: { value: '' },
        });
        fireEvent.blur(screen.getByTestId('reset-password-input'));

        expect(screen.getByText('비밀번호를 입력해주세요.')).toBeInTheDocument();
    });

    it('비밀번호 확인이 일치하지 않으면 validation 에러가 표시된다', () => {
        mockVerifyResult = { isLoading: false, isTokenValid: true, isTokenInvalid: false };

        render(<ResetPasswordForm />, { wrapper: createWrapper() });

        fireEvent.change(screen.getByTestId('reset-password-input'), {
            target: { value: 'validPass1!' },
        });
        fireEvent.change(screen.getByTestId('reset-password-confirm-input'), {
            target: { value: 'differentPass1!' },
        });
        fireEvent.blur(screen.getByTestId('reset-password-confirm-input'));

        expect(screen.getByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument();
    });

    it('비밀번호 변경 성공 시 성공 메시지가 표시된다', async () => {
        mockVerifyResult = { isLoading: false, isTokenValid: true, isTokenInvalid: false };
        mockConfirmMutate.mockImplementation(
            (_payload: unknown, options: { onSuccess?: () => void }) => {
                options?.onSuccess?.();
            },
        );

        render(<ResetPasswordForm />, { wrapper: createWrapper() });

        fireEvent.change(screen.getByTestId('reset-password-input'), {
            target: { value: 'validPass1!' },
        });
        fireEvent.change(screen.getByTestId('reset-password-confirm-input'), {
            target: { value: 'validPass1!' },
        });
        fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));

        await waitFor(() => {
            expect(screen.getByTestId('reset-password-success')).toBeInTheDocument();
        });
        expect(screen.getByText(/비밀번호가 성공적으로 변경되었습니다/)).toBeInTheDocument();
    });

    it('confirm mutation 에러 시 에러 메시지가 표시된다', () => {
        mockVerifyResult = { isLoading: false, isTokenValid: true, isTokenInvalid: false };
        mockConfirmMutation.isError = true;
        mockConfirmMutation.error = new Error('비밀번호 재설정 실패');

        render(<ResetPasswordForm />, { wrapper: createWrapper() });

        expect(screen.getByText('비밀번호 재설정 실패')).toBeInTheDocument();
    });

    it('confirm mutation pending 시 버튼이 비활성화되고 텍스트가 변경된다', () => {
        mockVerifyResult = { isLoading: false, isTokenValid: true, isTokenInvalid: false };
        mockConfirmMutation.isPending = true;

        render(<ResetPasswordForm />, { wrapper: createWrapper() });

        const button = screen.getByRole('button', { name: '변경 중...' });
        expect(button).toBeDisabled();
    });
});
