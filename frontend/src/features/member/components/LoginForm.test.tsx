import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const navigateMock = vi.fn();
const mockUseLogin = vi.fn();
const mockSearch = { redirect: undefined as string | undefined };

vi.mock('@tanstack/react-router', () => ({
    useNavigate: () => navigateMock,
    useSearch: () => mockSearch,
    Link: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) =>
        <a {...props}>{children}</a>,
}));

vi.mock('../hooks/useLogin', () => ({
    useLogin: () => mockUseLogin(),
}));

vi.mock('../hooks/useFormValidation', () => ({
    useFormValidation: () => ({
        fields: {},
        handleBlur: vi.fn(),
        validateAll: () => true,
        getInputClassName: (_name: string, base: string) => base,
    }),
}));

import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSearch.redirect = undefined;
        mockUseLogin.mockReturnValue({
            isPending: false,
            isError: false,
            error: null,
            mutate: vi.fn(),
        });
    });

    it('shows a generic message for 401 login errors', () => {
        mockUseLogin.mockReturnValue({
            isPending: false,
            isError: true,
            error: new Error('사용자가 없습니다.', { cause: 401 }),
            mutate: vi.fn(),
        });

        render(<LoginForm />);

        expect(screen.getByText('아이디 또는 비밀번호가 올바르지 않습니다.')).toBeInTheDocument();
        expect(screen.queryByText('사용자가 없습니다.')).not.toBeInTheDocument();
    });

    it('shows generic message for 5xx server errors', () => {
        mockUseLogin.mockReturnValue({
            isPending: false,
            isError: true,
            error: new Error('데이터베이스 오류: column not found', { cause: 500 }),
            mutate: vi.fn(),
        });

        render(<LoginForm />);

        expect(screen.getByText('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')).toBeInTheDocument();
        expect(screen.queryByText('데이터베이스 오류: column not found')).not.toBeInTheDocument();
    });

    it('로그인 성공 시 redirect param이 있으면 해당 경로로 이동한다', async () => {
        mockSearch.redirect = '/booking/my-bookings';
        const mutateMock = vi.fn((_data, options) => {
            options?.onSuccess?.();
        });
        mockUseLogin.mockReturnValue({
            isPending: false,
            isError: false,
            error: null,
            mutate: mutateMock,
        });

        render(<LoginForm />);

        const usernameInput = screen.getByLabelText('아이디');
        const passwordInput = screen.getByLabelText('비밀번호');
        fireEvent.change(usernameInput, { target: { value: 'testuser' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.submit(screen.getByRole('button', { name: '로그인' }));

        await waitFor(() => {
            expect(navigateMock).toHaveBeenCalledWith({ to: '/booking/my-bookings' });
        });
    });

    it('로그인 성공 시 redirect param이 없으면 홈으로 이동한다', async () => {
        const mutateMock = vi.fn((_data, options) => {
            options?.onSuccess?.();
        });
        mockUseLogin.mockReturnValue({
            isPending: false,
            isError: false,
            error: null,
            mutate: mutateMock,
        });

        render(<LoginForm />);

        const usernameInput = screen.getByLabelText('아이디');
        const passwordInput = screen.getByLabelText('비밀번호');
        fireEvent.change(usernameInput, { target: { value: 'testuser' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.submit(screen.getByRole('button', { name: '로그인' }));

        await waitFor(() => {
            expect(navigateMock).toHaveBeenCalledWith({ to: '/' });
        });
    });

    it('외부 URL redirect는 무시하고 홈으로 이동한다', async () => {
        mockSearch.redirect = 'https://evil.com';
        const mutateMock = vi.fn((_data, options) => {
            options?.onSuccess?.();
        });
        mockUseLogin.mockReturnValue({
            isPending: false,
            isError: false,
            error: null,
            mutate: mutateMock,
        });

        render(<LoginForm />);

        const usernameInput = screen.getByLabelText('아이디');
        const passwordInput = screen.getByLabelText('비밀번호');
        fireEvent.change(usernameInput, { target: { value: 'testuser' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.submit(screen.getByRole('button', { name: '로그인' }));

        await waitFor(() => {
            expect(navigateMock).toHaveBeenCalledWith({ to: '/' });
        });
    });
});
