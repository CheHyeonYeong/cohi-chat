/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';

// Mock TanStack Router Link component
vi.mock('@tanstack/react-router', () => ({
    Link: ({ children, to, className }: { children: React.ReactNode; to: string; className?: string }) => (
        <a href={to} className={className}>{children}</a>
    ),
}));

import Footer from './Footer';

describe('Footer', () => {
    afterEach(() => {
        cleanup();
    });

    it('should render copyright text with current year', () => {
        const { container } = render(<Footer />);
        const currentYear = new Date().getFullYear();

        const copyrightText = container.textContent;
        expect(copyrightText).toContain('Copyright');
        expect(copyrightText).toContain(`${currentYear}`);
        expect(copyrightText).toContain('coheChat');
    });

    it('should render terms of service link', () => {
        const { container } = render(<Footer />);

        const termsLink = Array.from(container.querySelectorAll('a')).find(
            (link) => link.textContent === '이용약관'
        );
        expect(termsLink).toBeDefined();
    });

    it('should render privacy policy link', () => {
        const { container } = render(<Footer />);

        const privacyLink = Array.from(container.querySelectorAll('a')).find(
            (link) => link.textContent === '개인정보처리방침'
        );
        expect(privacyLink).toBeDefined();
    });

    it('should have footer element', () => {
        const { container } = render(<Footer />);

        const footer = container.querySelector('footer');
        expect(footer).toBeDefined();
    });
});
