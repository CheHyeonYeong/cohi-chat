import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HostProfileCard } from './HostProfileCard';
import type { HostResponseDTO } from '~/features/member';

const baseHost: HostResponseDTO = {
    id: '1',
    username: 'alice',
    displayName: 'Alice Kim',
    job: '백엔드 개발자',
    profileImageUrl: 'https://example.com/alice.jpg',
    chatCount: 5,
};

describe('HostProfileCard', () => {
    it('프로필 이미지가 있으면 img를 렌더링한다', () => {
        render(<HostProfileCard host={baseHost} />);

        const img = screen.getByAltText('Alice Kim');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', 'https://example.com/alice.jpg');
    });

    it('프로필 이미지가 없으면 이름 첫 글자를 표시한다', () => {
        render(<HostProfileCard host={{ ...baseHost, profileImageUrl: undefined }} />);

        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('이름을 표시한다', () => {
        render(<HostProfileCard host={baseHost} />);

        expect(screen.getByTestId('host-profile-name')).toHaveTextContent('Alice Kim');
    });

    it('직업을 표시한다', () => {
        render(<HostProfileCard host={baseHost} />);

        expect(screen.getByTestId('host-profile-job')).toHaveTextContent('백엔드 개발자');
    });

    it('직업이 없으면 직업 영역을 렌더링하지 않는다', () => {
        render(<HostProfileCard host={{ ...baseHost, job: undefined }} />);

        expect(screen.queryByTestId('host-profile-job')).not.toBeInTheDocument();
    });

    it('chatCount > 0이면 커피챗 횟수 배지를 표시한다', () => {
        render(<HostProfileCard host={baseHost} />);

        expect(screen.getByTestId('host-profile-chat-count')).toHaveTextContent('커피챗 5회');
    });

    it('chatCount가 0이면 배지를 표시하지 않는다', () => {
        render(<HostProfileCard host={{ ...baseHost, chatCount: 0 }} />);

        expect(screen.queryByTestId('host-profile-chat-count')).not.toBeInTheDocument();
    });
});
