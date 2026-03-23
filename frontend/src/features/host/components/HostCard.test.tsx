import type { ReactElement, ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HostCard } from './HostCard';

vi.mock('@tanstack/react-router', () => ({
    Link: ({
        children,
        to,
        params,
        ...props
    }: {
        children: ReactNode;
        to: string;
        params?: Record<string, string>;
        [key: string]: unknown;
    }) => {
        const href = params ? to.replace('$hostId', params.hostId) : to;
        return (
            <a href={href} {...props}>
                {children}
            </a>
        );
    },
}));

const renderWithProviders = (ui: ReactElement) => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });

    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe('HostCard', () => {
    const defaultProps = {
        displayName: 'Test Host',
        username: 'test-host',
        chatCount: 5,
    };

    describe('기본 정보 표시', () => {
        it('호스트 이름을 표시한다', () => {
            renderWithProviders(<HostCard {...defaultProps} />);

            expect(screen.getByText('Test Host')).toBeInTheDocument();
        });

        it('직업이 있으면 표시한다', () => {
            renderWithProviders(<HostCard {...defaultProps} job="Software Engineer" />);

            expect(screen.getByText('Software Engineer')).toBeInTheDocument();
        });

        it('직업이 없으면 기본값 호스트를 표시한다', () => {
            renderWithProviders(<HostCard {...defaultProps} />);

            expect(screen.getByText('호스트')).toBeInTheDocument();
        });
    });

    describe('채팅 횟수 표시', () => {
        it('채팅 횟수가 0보다 크면 표시한다', () => {
            renderWithProviders(<HostCard {...defaultProps} chatCount={10} />);

            expect(screen.getByText('10회')).toBeInTheDocument();
        });

        it('채팅 횟수가 0이면 표시하지 않는다', () => {
            renderWithProviders(<HostCard {...defaultProps} chatCount={0} />);

            expect(screen.queryByText('0회')).not.toBeInTheDocument();
        });
    });

    describe('링크', () => {
        it('data-testid를 올바르게 설정한다', () => {
            renderWithProviders(<HostCard {...defaultProps} />);

            expect(screen.getByTestId('host-card-test-host')).toBeInTheDocument();
        });
    });
});
