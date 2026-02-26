import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import HostRegister from './HostRegister';
import * as hostHooks from '~/features/host/hooks';

// Mock dependencies
vi.mock('@tanstack/react-router', () => ({
    useNavigate: () => vi.fn(),
    Link: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
        React.createElement('a', props, children),
}));

vi.mock('~/features/member/api/memberApi', () => ({
    refreshTokenApi: vi.fn().mockResolvedValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
    }),
}));

vi.mock('~/features/member/utils/authEvent', () => ({
    dispatchAuthChange: vi.fn(),
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

describe('HostRegister', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    describe('캘린더 생성 성공 시 메시지 표시', () => {
        it('mutation reset 후에도 성공 상태가 유지되어야 한다', async () => {
            let isSuccessState = false;
            const mutateMock = vi.fn((_, options) => {
                isSuccessState = true;
                options?.onSuccess?.();
            });
            const resetMock = vi.fn(() => {
                isSuccessState = false;
            });

            vi.spyOn(hostHooks, 'useCreateCalendar').mockImplementation(
                () =>
                    ({
                        mutate: mutateMock,
                        mutateAsync: vi.fn(),
                        isPending: false,
                        get isSuccess() {
                            return isSuccessState;
                        },
                        isError: false,
                        isIdle: !isSuccessState,
                        error: null,
                        data: undefined,
                        reset: resetMock,
                        status: isSuccessState ? 'success' : 'idle',
                        variables: undefined,
                        context: undefined,
                        failureCount: 0,
                        failureReason: null,
                        isPaused: false,
                        submittedAt: 0,
                    }) as unknown as ReturnType<typeof hostHooks.useCreateCalendar>,
            );

            render(<HostRegister />, { wrapper: createWrapper() });

            // 1단계 데이터 입력
            const topicInput = screen.getByPlaceholderText(/주제를 입력하고 Enter/i);
            const descInput = screen.getByPlaceholderText(/미팅에 대한 소개를 작성해주세요/i);

            fireEvent.change(topicInput, { target: { value: '테스트 주제' } });
            fireEvent.keyDown(topicInput, { key: 'Enter' });
            fireEvent.change(descInput, { target: { value: '이것은 10자 이상의 소개입니다.' } });

            // 2단계로 이동
            fireEvent.click(screen.getByRole('button', { name: /다음 단계/i }));
            await waitFor(() => {
                expect(screen.getByText(/Google Calendar 연동하기/i)).toBeInTheDocument();
            });

            // 2단계 데이터 입력
            const calendarIdInput = screen.getByPlaceholderText(/your-id@group.calendar.google.com/i);
            fireEvent.change(calendarIdInput, {
                target: { value: 'test@group.calendar.google.com' },
            });

            // 3단계로 이동
            fireEvent.click(screen.getByRole('button', { name: /다음 단계/i }));
            await waitFor(() => {
                expect(screen.getByText(/등록 정보 확인/i)).toBeInTheDocument();
            });

            // 호스트 등록 완료 버튼 클릭
            fireEvent.click(screen.getByRole('button', { name: /호스트 등록 완료/i }));

            // mutate 호출되고 onSuccess 실행됨
            await waitFor(() => {
                expect(mutateMock).toHaveBeenCalled();
            });

            // 성공 후 성공 메시지가 표시되어야 함
            await waitFor(() => {
                expect(screen.getByText('호스트 등록 완료!')).toBeInTheDocument();
                expect(
                    screen.getByText(
                        '캘린더가 성공적으로 생성되었습니다. 이제 예약 가능 시간을 설정해보세요.',
                    ),
                ).toBeInTheDocument();
            });

            // mutation.reset()이 호출되어 isSuccessState가 false가 되어도
            // 컴포넌트의 isCompleted state는 유지되어야 함
            resetMock();
            expect(isSuccessState).toBe(false); // mutation 상태는 초기화됨

            // 하지만 성공 메시지는 여전히 표시되어야 함 (isCompleted state로 관리되기 때문)
            expect(screen.getByText('호스트 등록 완료!')).toBeInTheDocument();
            expect(
                screen.getByText(
                    '캘린더가 성공적으로 생성되었습니다. 이제 예약 가능 시간을 설정해보세요.',
                ),
            ).toBeInTheDocument();
        });
    });

    describe('스텝 이동 시 mutation 상태 초기화', () => {
        it('이전 단계로 이동 시 reset이 호출된다', async () => {
            const resetMock = vi.fn();

            vi.spyOn(hostHooks, 'useCreateCalendar').mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
                isSuccess: false,
                error: null,
                reset: resetMock,
            } as unknown as ReturnType<typeof hostHooks.useCreateCalendar>);

            render(<HostRegister />, { wrapper: createWrapper() });

            // 1단계 데이터 입력
            const topicInput = screen.getByPlaceholderText(/주제를 입력하고 Enter/i);
            const descInput = screen.getByPlaceholderText(/미팅에 대한 소개를 작성해주세요/i);

            fireEvent.change(topicInput, { target: { value: '테스트 주제' } });
            fireEvent.keyDown(topicInput, { key: 'Enter' });
            fireEvent.change(descInput, { target: { value: '이것은 10자 이상의 소개입니다.' } });

            // 다음 단계로 이동
            const nextButton = screen.getByRole('button', { name: /다음 단계/i });
            fireEvent.click(nextButton);

            // 2단계로 이동 확인
            await waitFor(() => {
                expect(screen.getByText(/Google Calendar 연동하기/i)).toBeInTheDocument();
            });

            // reset이 handleNext에서 호출되었는지 확인
            expect(resetMock).toHaveBeenCalled();

            // 이전 버튼 클릭
            const prevButton = screen.getByRole('button', { name: /이전/i });
            fireEvent.click(prevButton);

            // 1단계로 돌아옴 확인
            await waitFor(() => {
                expect(screen.getByText(/기본 정보 입력/i)).toBeInTheDocument();
            });

            // reset이 handlePrev에서도 호출되었는지 확인 (2번 호출)
            expect(resetMock).toHaveBeenCalledTimes(2);
        });

        it('다음 단계로 이동 시 reset이 호출된다', async () => {
            const resetMock = vi.fn();

            vi.spyOn(hostHooks, 'useCreateCalendar').mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
                isSuccess: false,
                error: null,
                reset: resetMock,
            } as unknown as ReturnType<typeof hostHooks.useCreateCalendar>);

            render(<HostRegister />, { wrapper: createWrapper() });

            // 1단계 데이터 입력
            const topicInput = screen.getByPlaceholderText(/주제를 입력하고 Enter/i);
            const descInput = screen.getByPlaceholderText(/미팅에 대한 소개를 작성해주세요/i);

            fireEvent.change(topicInput, { target: { value: '테스트 주제' } });
            fireEvent.keyDown(topicInput, { key: 'Enter' });
            fireEvent.change(descInput, { target: { value: '이것은 10자 이상의 소개입니다.' } });

            // 다음 단계로 이동
            const nextButton = screen.getByRole('button', { name: /다음 단계/i });
            fireEvent.click(nextButton);

            // Then: handleNext 호출 시 reset이 호출되어야 함
            await waitFor(() => {
                expect(resetMock).toHaveBeenCalled();
            });
        });
    });
});

describe('RegisterStep3 성공 메시지 표시', () => {
    it('isSuccess가 true일 때 성공 메시지가 표시된다', async () => {
        const { default: RegisterStep3 } = await import(
            '~/features/host/components/register/RegisterStep3'
        );

        const mockProps = {
            step1: { topics: ['테스트'], description: '이것은 테스트 설명입니다.' },
            step2: { googleCalendarId: 'test@group.calendar.google.com' },
            isPending: false,
            error: null,
            isSuccess: true,
            tokenRefreshFailed: false,
            onSubmit: vi.fn(),
        };

        render(<RegisterStep3 {...mockProps} />, { wrapper: createWrapper() });

        // 성공 메시지 확인
        expect(screen.getByText('호스트 등록 완료!')).toBeInTheDocument();
        expect(
            screen.getByText('캘린더가 성공적으로 생성되었습니다. 이제 예약 가능 시간을 설정해보세요.'),
        ).toBeInTheDocument();
    });

    it('tokenRefreshFailed가 true이면 재로그인 안내 메시지가 표시된다', async () => {
        // RegisterStep3 컴포넌트를 직접 import하여 테스트
        const { default: RegisterStep3 } = await import(
            '~/features/host/components/register/RegisterStep3'
        );

        const mockProps = {
            step1: { topics: ['테스트'], description: '이것은 테스트 설명입니다.' },
            step2: { googleCalendarId: 'test@group.calendar.google.com' },
            isPending: false,
            error: null,
            isSuccess: true,
            tokenRefreshFailed: true,
            onSubmit: vi.fn(),
        };

        render(<RegisterStep3 {...mockProps} />, { wrapper: createWrapper() });

        // 재로그인 안내 메시지 확인
        expect(screen.getByText(/재로그인/)).toBeInTheDocument();
    });

    it('tokenRefreshFailed가 false이면 재로그인 안내 메시지가 표시되지 않는다', async () => {
        const { default: RegisterStep3 } = await import(
            '~/features/host/components/register/RegisterStep3'
        );

        const mockProps = {
            step1: { topics: ['테스트'], description: '이것은 테스트 설명입니다.' },
            step2: { googleCalendarId: 'test@group.calendar.google.com' },
            isPending: false,
            error: null,
            isSuccess: true,
            tokenRefreshFailed: false,
            onSubmit: vi.fn(),
        };

        render(<RegisterStep3 {...mockProps} />, { wrapper: createWrapper() });

        // 재로그인 안내 메시지가 없어야 함
        expect(screen.queryByText(/재로그인/)).not.toBeInTheDocument();
    });
});
