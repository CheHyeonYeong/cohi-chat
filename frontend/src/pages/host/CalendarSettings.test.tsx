import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import CalendarSettings from './CalendarSettings';
import * as hostHooks from '~/features/host/hooks';

// Mock dependencies
vi.mock('@tanstack/react-router', () => ({
    useNavigate: () => vi.fn(),
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => 
        React.createElement('a', { href: to }, children),
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

const mockCalendarData = {
    userId: 'user123',
    topics: ['Topic 1', 'Topic 2'],
    description: 'This is a test description with more than 10 characters.',
    googleCalendarId: 'test@group.calendar.google.com',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
};

describe('CalendarSettings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('기존 캘린더 정보를 불러와서 표시해야 한다', async () => {
        vi.spyOn(hostHooks, 'useMyCalendar').mockReturnValue({
            data: mockCalendarData,
            isLoading: false,
            error: null,
        } as unknown as ReturnType<typeof hostHooks.useMyCalendar>);

        vi.spyOn(hostHooks, 'useUpdateCalendar').mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        } as unknown as ReturnType<typeof hostHooks.useUpdateCalendar>);

        render(<CalendarSettings />, { wrapper: createWrapper() });

        expect(screen.getByText('Topic 1')).toBeInTheDocument();
        expect(screen.getByText('Topic 2')).toBeInTheDocument();
        expect(screen.getByDisplayValue(mockCalendarData.description)).toBeInTheDocument();
        expect(screen.getByDisplayValue(mockCalendarData.googleCalendarId)).toBeInTheDocument();
    });

    it('정보를 수정하고 저장할 수 있어야 한다', async () => {
        vi.spyOn(hostHooks, 'useMyCalendar').mockReturnValue({
            data: mockCalendarData,
            isLoading: false,
            error: null,
        } as unknown as ReturnType<typeof hostHooks.useMyCalendar>);

        const mutateAsyncMock = vi.fn().mockResolvedValue(mockCalendarData);
        vi.spyOn(hostHooks, 'useUpdateCalendar').mockReturnValue({
            mutateAsync: mutateAsyncMock,
            isPending: false,
        } as unknown as ReturnType<typeof hostHooks.useUpdateCalendar>);

        render(<CalendarSettings />, { wrapper: createWrapper() });

        const descInput = screen.getByDisplayValue(mockCalendarData.description);
        fireEvent.change(descInput, { target: { value: 'Updated description that is long enough.' } });

        const saveButton = screen.getByRole('button', { name: /저장하기/i });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mutateAsyncMock).toHaveBeenCalledWith({
                topics: mockCalendarData.topics,
                description: 'Updated description that is long enough.',
                googleCalendarId: mockCalendarData.googleCalendarId,
            });
        });
    });

    it('유효성 검사 실패 시 에러 메시지를 표시해야 한다', async () => {
        vi.spyOn(hostHooks, 'useMyCalendar').mockReturnValue({
            data: mockCalendarData,
            isLoading: false,
            error: null,
        } as unknown as ReturnType<typeof hostHooks.useMyCalendar>);

        vi.spyOn(hostHooks, 'useUpdateCalendar').mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        } as unknown as ReturnType<typeof hostHooks.useUpdateCalendar>);

        render(<CalendarSettings />, { wrapper: createWrapper() });

        const descInput = screen.getByDisplayValue(mockCalendarData.description);
        fireEvent.change(descInput, { target: { value: 'short' } }); // 10자 미만

        const saveButton = screen.getByRole('button', { name: /저장하기/i });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(screen.getByText(/소개는 최소 10자 이상 입력해주세요/i)).toBeInTheDocument();
        });
    });

    it('로딩 중일 때 로딩 상태를 표시해야 한다', () => {
        vi.spyOn(hostHooks, 'useMyCalendar').mockReturnValue({
            data: undefined,
            isLoading: true,
            error: null,
        } as unknown as ReturnType<typeof hostHooks.useMyCalendar>);

        render(<CalendarSettings />, { wrapper: createWrapper() });
        expect(screen.getByText(/불러오는 중/i)).toBeInTheDocument();
    });

    it('데이터 로드 실패 시 에러 메시지를 표시해야 한다', () => {
        vi.spyOn(hostHooks, 'useMyCalendar').mockReturnValue({
            data: undefined,
            isLoading: false,
            error: new Error('Load failed'),
        } as unknown as ReturnType<typeof hostHooks.useMyCalendar>);

        render(<CalendarSettings />, { wrapper: createWrapper() });
        expect(screen.getByText(/정보를 불러오지 못했습니다/i)).toBeInTheDocument();
    });

    it('저장 중일 때 버튼이 비활성화되고 텍스트가 변경되어야 한다', async () => {
        vi.spyOn(hostHooks, 'useMyCalendar').mockReturnValue({
            data: mockCalendarData,
            isLoading: false,
            error: null,
        } as unknown as ReturnType<typeof hostHooks.useMyCalendar>);

        vi.spyOn(hostHooks, 'useUpdateCalendar').mockReturnValue({
            mutateAsync: vi.fn(),
            isPending: true,
        } as unknown as ReturnType<typeof hostHooks.useUpdateCalendar>);

        render(<CalendarSettings />, { wrapper: createWrapper() });
        
        const saveButton = screen.getByRole('button', { name: /저장 중/i });
        expect(saveButton).toBeDisabled();
    });
});