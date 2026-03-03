import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { ProfileEditForm } from './ProfileEditForm';

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

describe('ProfileEditForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockMutation.isPending = false;
        mockMutation.isError = false;
        mockMutation.error = null;
    });

    it('폼이 렌더링되고 기존 displayName이 표시된다', () => {
        render(<ProfileEditForm />, { wrapper: createWrapper() });

        expect(screen.getByTestId('profile-edit-form')).toBeInTheDocument();
        expect(screen.getByTestId('display-name-input')).toHaveValue('Test User');
        expect(screen.getByRole('button', { name: '변경하기' })).toBeInTheDocument();
    });

    it('displayName을 변경하고 제출하면 mutate가 호출된다', async () => {
        render(<ProfileEditForm />, { wrapper: createWrapper() });

        const input = screen.getByTestId('display-name-input');
        fireEvent.change(input, { target: { value: 'New Name' } });
        fireEvent.click(screen.getByRole('button', { name: '변경하기' }));

        await waitFor(() => {
            expect(mockMutate).toHaveBeenCalledWith(
                { displayName: 'New Name' },
                expect.objectContaining({ onSuccess: expect.any(Function) }),
            );
        });
    });

    it('빈 displayName으로 제출하면 validation 에러가 표시된다', () => {
        render(<ProfileEditForm />, { wrapper: createWrapper() });

        const input = screen.getByTestId('display-name-input');
        fireEvent.change(input, { target: { value: '' } });
        fireEvent.click(screen.getByRole('button', { name: '변경하기' }));

        expect(mockMutate).not.toHaveBeenCalled();
    });

    it('1자 displayName으로 제출하면 validation 에러가 표시된다', () => {
        render(<ProfileEditForm />, { wrapper: createWrapper() });

        const input = screen.getByTestId('display-name-input');
        fireEvent.change(input, { target: { value: 'A' } });
        fireEvent.blur(input);

        expect(screen.getByText('표시 이름은 2~20자여야 합니다.')).toBeInTheDocument();
    });

    it('mutation 성공 시 성공 메시지가 표시된다', async () => {
        mockMutate.mockImplementation((_payload: unknown, options: { onSuccess?: () => void }) => {
            options?.onSuccess?.();
        });

        render(<ProfileEditForm />, { wrapper: createWrapper() });

        const input = screen.getByTestId('display-name-input');
        fireEvent.change(input, { target: { value: 'New Name' } });
        fireEvent.click(screen.getByRole('button', { name: '변경하기' }));

        await waitFor(() => {
            expect(screen.getByTestId('profile-success-message')).toHaveTextContent(
                '표시 이름이 변경되었습니다.',
            );
        });
    });

    it('mutation 에러 시 에러 메시지가 표시된다', () => {
        mockMutation.isError = true;
        mockMutation.error = new Error('서버 오류');

        render(<ProfileEditForm />, { wrapper: createWrapper() });

        expect(screen.getByText('서버 오류')).toBeInTheDocument();
    });

    it('mutation pending 시 버튼이 비활성화되고 텍스트가 변경된다', () => {
        mockMutation.isPending = true;

        render(<ProfileEditForm />, { wrapper: createWrapper() });

        const button = screen.getByRole('button', { name: '변경 중...' });
        expect(button).toBeDisabled();
    });
});
