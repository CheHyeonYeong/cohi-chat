import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HostProfileCard } from './HostProfileCard';
import type { HostResponseDTO } from '../types';

const mockProfileMutate = vi.fn();
const mockMemberMutate = vi.fn();
const mockUploadMutate = vi.fn();
const mockDeleteMutate = vi.fn();

vi.mock('~/contexts', () => ({
    useIsSelf: vi.fn(() => false),
    IsSelfProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('~/features/member', () => ({
    useUpdateProfile: () => ({
        mutate: mockProfileMutate,
        isPending: false,
        isError: false,
        error: null,
    }),
    useUpdateMember: () => ({
        mutate: mockMemberMutate,
        isPending: false,
        isError: false,
        error: null,
    }),
    useUploadProfileImage: () => ({
        mutate: mockUploadMutate,
        isPending: false,
    }),
    useDeleteProfileImage: () => ({
        mutate: mockDeleteMutate,
        isPending: false,
    }),
}));

import { useIsSelf } from '~/contexts';

const baseHost: HostResponseDTO = {
    id: '1',
    username: 'alice',
    displayName: 'Alice Kim',
    job: '백엔드 개발자',
    profileImageUrl: 'https://example.com/alice.jpg',
    chatCount: 5,
};

const createWrapper = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('HostProfileCard', () => {
    beforeEach(() => {
        vi.mocked(useIsSelf).mockReturnValue(false);
        mockProfileMutate.mockReset();
        mockMemberMutate.mockReset();
        mockUploadMutate.mockReset();
        mockDeleteMutate.mockReset();
    });

    it('프로필 이미지가 있으면 img를 렌더링한다', () => {
        render(<HostProfileCard host={baseHost} />, { wrapper: createWrapper() });

        const img = screen.getByAltText('Alice Kim');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', 'https://example.com/alice.jpg');
    });

    it('프로필 이미지가 없으면 이름 첫 글자를 표시한다', () => {
        render(<HostProfileCard host={{ ...baseHost, profileImageUrl: undefined }} />, { wrapper: createWrapper() });

        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('이름을 표시한다', () => {
        render(<HostProfileCard host={baseHost} />, { wrapper: createWrapper() });

        expect(screen.getByTestId('host-profile-name')).toHaveTextContent('Alice Kim');
    });

    it('직업을 표시한다', () => {
        render(<HostProfileCard host={baseHost} />, { wrapper: createWrapper() });

        expect(screen.getByTestId('host-profile-job')).toHaveTextContent('백엔드 개발자');
    });

    it('직업이 없으면 직업 영역을 렌더링하지 않는다', () => {
        render(<HostProfileCard host={{ ...baseHost, job: undefined }} />, { wrapper: createWrapper() });

        expect(screen.queryByTestId('host-profile-job')).not.toBeInTheDocument();
    });

    it('chatCount > 0이면 커피챗 횟수 배지를 표시한다', () => {
        render(<HostProfileCard host={baseHost} />, { wrapper: createWrapper() });

        expect(screen.getByTestId('host-profile-chat-count')).toHaveTextContent('커피챗 5회');
    });

    it('chatCount가 0이면 배지를 표시하지 않는다', () => {
        render(<HostProfileCard host={{ ...baseHost, chatCount: 0 }} />, { wrapper: createWrapper() });

        expect(screen.queryByTestId('host-profile-chat-count')).not.toBeInTheDocument();
    });

    describe('isSelf = true일 때', () => {
        beforeEach(() => {
            vi.mocked(useIsSelf).mockReturnValue(true);
        });

        it('편집 버튼이 표시된다', () => {
            render(<HostProfileCard host={baseHost} />, { wrapper: createWrapper() });

            expect(screen.getByTestId('profile-edit-button')).toBeInTheDocument();
        });

        it('편집 버튼 클릭 시 편집 모드로 진입한다', async () => {
            const user = userEvent.setup();
            render(<HostProfileCard host={baseHost} />, { wrapper: createWrapper() });

            await user.click(screen.getByTestId('profile-edit-button'));

            expect(screen.getByTestId('avatar-overlay')).toBeInTheDocument();
            expect(screen.getByTestId('host-profile-name-input')).toBeInTheDocument();
            expect(screen.getByTestId('host-profile-job-input')).toBeInTheDocument();
            expect(screen.getByTestId('profile-edit-actions')).toBeInTheDocument();
        });

        it('취소 버튼 클릭 시 편집 모드를 종료한다', async () => {
            const user = userEvent.setup();
            render(<HostProfileCard host={baseHost} />, { wrapper: createWrapper() });

            await user.click(screen.getByTestId('profile-edit-button'));
            await user.click(screen.getByRole('button', { name: '취소' }));

            expect(screen.queryByTestId('avatar-overlay')).not.toBeInTheDocument();
            expect(screen.queryByTestId('host-profile-name-input')).not.toBeInTheDocument();
            expect(screen.queryByTestId('host-profile-job-input')).not.toBeInTheDocument();
        });

        it('닉네임만 변경 시 updateMember를 호출한다', async () => {
            const user = userEvent.setup();
            render(<HostProfileCard host={baseHost} />, { wrapper: createWrapper() });

            await user.click(screen.getByTestId('profile-edit-button'));

            const nameInput = screen.getByTestId('host-profile-name-input');
            await user.clear(nameInput);
            await user.type(nameInput, '새닉네임');

            await user.click(screen.getByRole('button', { name: '저장' }));

            expect(mockMemberMutate).toHaveBeenCalledWith(
                { displayName: '새닉네임' },
                expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
            );
            expect(mockProfileMutate).not.toHaveBeenCalled();
        });

        it('직업만 변경 시 updateProfile을 호출한다', async () => {
            const user = userEvent.setup();
            render(<HostProfileCard host={baseHost} />, { wrapper: createWrapper() });

            await user.click(screen.getByTestId('profile-edit-button'));

            const jobInput = screen.getByTestId('host-profile-job-input');
            await user.clear(jobInput);
            await user.type(jobInput, '프론트엔드 개발자');

            await user.click(screen.getByRole('button', { name: '저장' }));

            expect(mockProfileMutate).toHaveBeenCalledWith(
                { job: '프론트엔드 개발자' },
                expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
            );
            expect(mockMemberMutate).not.toHaveBeenCalled();
        });

        it('편집 모드에서 아바타 오버레이에 변경/삭제 버튼이 표시된다', async () => {
            const user = userEvent.setup();
            render(<HostProfileCard host={baseHost} />, { wrapper: createWrapper() });

            await user.click(screen.getByTestId('profile-edit-button'));

            expect(screen.getByTestId('avatar-change-button')).toHaveTextContent('변경');
            expect(screen.getByTestId('avatar-delete-button')).toHaveTextContent('삭제');
        });

        it('프로필 이미지가 없으면 삭제 버튼이 표시되지 않는다', async () => {
            const user = userEvent.setup();
            render(
                <HostProfileCard host={{ ...baseHost, profileImageUrl: undefined }} />,
                { wrapper: createWrapper() },
            );

            await user.click(screen.getByTestId('profile-edit-button'));

            expect(screen.getByTestId('avatar-change-button')).toBeInTheDocument();
            expect(screen.queryByTestId('avatar-delete-button')).not.toBeInTheDocument();
        });
    });

    describe('isSelf = false일 때', () => {
        it('편집 버튼이 표시되지 않는다', () => {
            render(<HostProfileCard host={baseHost} />, { wrapper: createWrapper() });

            expect(screen.queryByTestId('profile-edit-button')).not.toBeInTheDocument();
        });
    });
});
