import type { PropsWithChildren, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ForgotPasswordForm } from './ForgotPasswordForm';

vi.mock('@tanstack/react-router', () => ({
    useNavigate: () => vi.fn(),
    Link: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) =>
        <a {...props}>{children}</a>,
}));

const mockMutate = vi.fn();
const mockMutation: {
    mutate: typeof mockMutate;
    isPending: boolean;
    isError: boolean;
    error: Error | null;
} = {
    mutate: mockMutate,
    isPending: false,
    isError: false,
    error: null,
};

vi.mock('../hooks/usePasswordReset', () => ({
    useRequestPasswordReset: () => mockMutation,
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

describe('ForgotPasswordForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockMutate.mockReset();
        mockMutation.isPending = false;
        mockMutation.isError = false;
        mockMutation.error = null;
    });

    it('이메일 폼이 렌더링된다', () => {
        render(<ForgotPasswordForm />, { wrapper: createWrapper() });

        expect(screen.getByText('비밀번호 찾기')).toBeInTheDocument();
        expect(screen.getByTestId('forgot-password-email')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '재설정 링크 받기' })).toBeInTheDocument();
    });

    it('유효한 이메일로 제출하면 mutate가 호출된다', async () => {
        render(<ForgotPasswordForm />, { wrapper: createWrapper() });

        fireEvent.change(screen.getByTestId('forgot-password-email'), {
            target: { value: 'test@example.com' },
        });
        fireEvent.click(screen.getByRole('button', { name: '재설정 링크 받기' }));

        await waitFor(() => {
            expect(mockMutate).toHaveBeenCalledWith(
                'test@example.com',
                expect.objectContaining({ onSuccess: expect.any(Function) }),
            );
        });
    });

    it('이메일이 비어있으면 validation 에러가 표시된다', () => {
        render(<ForgotPasswordForm />, { wrapper: createWrapper() });

        fireEvent.change(screen.getByTestId('forgot-password-email'), {
            target: { value: '' },
        });
        fireEvent.blur(screen.getByTestId('forgot-password-email'));

        expect(screen.getByText('이메일을 입력해주세요.')).toBeInTheDocument();
    });

    it('잘못된 이메일 형식이면 validation 에러가 표시된다', () => {
        render(<ForgotPasswordForm />, { wrapper: createWrapper() });

        fireEvent.change(screen.getByTestId('forgot-password-email'), {
            target: { value: 'invalid-email' },
        });
        fireEvent.blur(screen.getByTestId('forgot-password-email'));

        expect(screen.getByText('올바른 이메일 형식이 아닙니다.')).toBeInTheDocument();
    });

    it('mutation 성공 시 성공 메시지가 표시된다', async () => {
        mockMutate.mockImplementation((_payload: unknown, options: { onSuccess?: () => void }) => {
            options?.onSuccess?.();
        });

        render(<ForgotPasswordForm />, { wrapper: createWrapper() });

        fireEvent.change(screen.getByTestId('forgot-password-email'), {
            target: { value: 'test@example.com' },
        });
        fireEvent.click(screen.getByRole('button', { name: '재설정 링크 받기' }));

        await waitFor(() => {
            expect(screen.getByTestId('forgot-password-success')).toBeInTheDocument();
        });
        expect(screen.getByText(/입력하신 이메일로 비밀번호 재설정 링크를 발송했습니다/)).toBeInTheDocument();
    });

    it('mutation 에러 시 에러 메시지가 표시된다', () => {
        mockMutation.isError = true;
        mockMutation.error = new Error('요청 실패');

        render(<ForgotPasswordForm />, { wrapper: createWrapper() });

        expect(screen.getByText('요청 실패')).toBeInTheDocument();
    });

    it('mutation pending 시 버튼이 비활성화되고 텍스트가 변경된다', () => {
        mockMutation.isPending = true;

        render(<ForgotPasswordForm />, { wrapper: createWrapper() });

        const button = screen.getByRole('button', { name: '전송 중...' });
        expect(button).toBeDisabled();
    });
});
