import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { PasswordChangeForm } from './PasswordChangeForm';

vi.mock('@tanstack/react-router', () => ({
    useNavigate: () => vi.fn(),
    Link: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
        React.createElement('a', props, children),
}));

const mockMutate = vi.fn();
const mockMutation = {
    mutate: mockMutate,
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
};

vi.mock('../hooks/useUpdateMember', () => ({
    useUpdateMember: () => mockMutation,
}));

vi.mock('../hooks/useAuth', () => ({
    useAuth: () => ({
        data: {
            id: 'test-id',
            username: 'testuser',
            displayName: 'Test User',
            email: 'test@example.com',
            role: 'GUEST',
            isHost: false,
        },
        isAuthenticated: true,
        isLoading: false,
        isSuccess: true,
    }),
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

describe('PasswordChangeForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockMutation.isPending = false;
        mockMutation.isError = false;
        mockMutation.error = null;
    });

    it('폼이 렌더링된다', () => {
        render(<PasswordChangeForm />, { wrapper: createWrapper() });

        expect(screen.getByTestId('password-change-form')).toBeInTheDocument();
        expect(screen.getByTestId('new-password-input')).toBeInTheDocument();
        expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '비밀번호 변경' })).toBeInTheDocument();
    });

    it('유효한 비밀번호로 제출하면 mutate가 호출된다', async () => {
        render(<PasswordChangeForm />, { wrapper: createWrapper() });

        fireEvent.change(screen.getByTestId('new-password-input'), {
            target: { value: 'validPass1!' },
        });
        fireEvent.change(screen.getByTestId('confirm-password-input'), {
            target: { value: 'validPass1!' },
        });
        fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));

        await waitFor(() => {
            expect(mockMutate).toHaveBeenCalledWith(
                { password: 'validPass1!' },
                expect.objectContaining({ onSuccess: expect.any(Function) }),
            );
        });
    });

    it('비밀번호가 비어있으면 validation 에러가 표시된다', () => {
        render(<PasswordChangeForm />, { wrapper: createWrapper() });

        fireEvent.change(screen.getByTestId('new-password-input'), {
            target: { value: '' },
        });
        fireEvent.blur(screen.getByTestId('new-password-input'));

        expect(screen.getByText('새 비밀번호를 입력해주세요.')).toBeInTheDocument();
    });

    it('비밀번호가 8자 미만이면 validation 에러가 표시된다', () => {
        render(<PasswordChangeForm />, { wrapper: createWrapper() });

        fireEvent.change(screen.getByTestId('new-password-input'), {
            target: { value: 'short' },
        });
        fireEvent.blur(screen.getByTestId('new-password-input'));

        expect(
            screen.getByText('비밀번호는 8~20자의 영문, 숫자, 특수문자(!@#$%^&*._-)만 가능합니다.'),
        ).toBeInTheDocument();
    });

    it('비밀번호 확인이 일치하지 않으면 validation 에러가 표시된다', () => {
        render(<PasswordChangeForm />, { wrapper: createWrapper() });

        fireEvent.change(screen.getByTestId('new-password-input'), {
            target: { value: 'validPass1!' },
        });
        fireEvent.change(screen.getByTestId('confirm-password-input'), {
            target: { value: 'differentPass1!' },
        });
        fireEvent.blur(screen.getByTestId('confirm-password-input'));

        expect(screen.getByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument();
    });

    it('mutation 성공 시 성공 메시지가 표시되고 입력값이 초기화된다', async () => {
        mockMutate.mockImplementation((_payload: unknown, options: { onSuccess?: () => void }) => {
            options?.onSuccess?.();
        });

        render(<PasswordChangeForm />, { wrapper: createWrapper() });

        fireEvent.change(screen.getByTestId('new-password-input'), {
            target: { value: 'validPass1!' },
        });
        fireEvent.change(screen.getByTestId('confirm-password-input'), {
            target: { value: 'validPass1!' },
        });
        fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));

        await waitFor(() => {
            expect(screen.getByTestId('password-success-message')).toHaveTextContent(
                '비밀번호가 변경되었습니다.',
            );
        });

        // 입력값이 초기화되었는지 확인
        expect(screen.getByTestId('new-password-input')).toHaveValue('');
        expect(screen.getByTestId('confirm-password-input')).toHaveValue('');
    });

    it('mutation 에러 시 에러 메시지가 표시된다', () => {
        mockMutation.isError = true;
        mockMutation.error = new Error('비밀번호 변경 실패');

        render(<PasswordChangeForm />, { wrapper: createWrapper() });

        expect(screen.getByText('비밀번호 변경 실패')).toBeInTheDocument();
    });

    it('mutation pending 시 버튼이 비활성화되고 텍스트가 변경된다', () => {
        mockMutation.isPending = true;

        render(<PasswordChangeForm />, { wrapper: createWrapper() });

        const button = screen.getByRole('button', { name: '변경 중...' });
        expect(button).toBeDisabled();
    });

    it('허용되지 않은 특수문자가 포함된 비밀번호는 validation 에러가 표시된다', () => {
        render(<PasswordChangeForm />, { wrapper: createWrapper() });

        fireEvent.change(screen.getByTestId('new-password-input'), {
            target: { value: 'pass word1!' },
        });
        fireEvent.blur(screen.getByTestId('new-password-input'));

        expect(
            screen.getByText('비밀번호는 8~20자의 영문, 숫자, 특수문자(!@#$%^&*._-)만 가능합니다.'),
        ).toBeInTheDocument();
    });
});
