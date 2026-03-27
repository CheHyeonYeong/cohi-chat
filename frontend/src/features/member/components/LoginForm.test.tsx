import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const navigateMock = vi.fn();
const mockUseLogin = vi.fn();

vi.mock('@tanstack/react-router', () => ({
    useNavigate: () => navigateMock,
    Link: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) =>
        <a {...props}>{children}</a>,
}));

vi.mock('../hooks/useLogin', () => ({
    useLogin: () => mockUseLogin(),
}));

import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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

    it('shows the detailed message for non-authentication errors', () => {
        mockUseLogin.mockReturnValue({
            isPending: false,
            isError: true,
            error: new Error('서버 오류', { cause: 500 }),
            mutate: vi.fn(),
        });

        render(<LoginForm />);

        expect(screen.getByText('서버 오류')).toBeInTheDocument();
    });
});
