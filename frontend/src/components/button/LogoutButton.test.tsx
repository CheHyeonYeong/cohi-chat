/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';

const mockLogoutFn = vi.fn();
const mockUseLogout = vi.hoisted(() => vi.fn(() => ({
    logout: mockLogoutFn,
})));

vi.mock('~/features/member', () => ({
    useLogout: mockUseLogout,
}));

import { LogoutButton } from './LogoutButton';

describe('LogoutButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseLogout.mockReturnValue({
            logout: mockLogoutFn,
        });
    });

    afterEach(() => {
        cleanup();
    });

    it('should render logout button with correct text', () => {
        const { container } = render(<LogoutButton />);

        const button = container.querySelector('button');
        expect(button).toBeDefined();
        expect(button?.textContent).toBe('로그아웃');
    });

    it('should apply cohi-btn-outline style', () => {
        const { container } = render(<LogoutButton />);

        const button = container.querySelector('button');
        expect(button?.className).toContain('cohi-btn-outline');
    });

    it('should call logout when clicked', () => {
        const { container } = render(<LogoutButton />);

        const button = container.querySelector('button');
        if (button) {
            fireEvent.click(button);
        }

        expect(mockLogoutFn).toHaveBeenCalled();
    });
});
