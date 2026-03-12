import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HostTopicTags } from './HostTopicTags';

describe('HostTopicTags', () => {
    it('토픽 태그들을 렌더링한다', () => {
        render(<HostTopicTags topics={['개발 커리어', '이직 준비', '기술 면접']} />);

        expect(screen.getByText('개발 커리어')).toBeInTheDocument();
        expect(screen.getByText('이직 준비')).toBeInTheDocument();
        expect(screen.getByText('기술 면접')).toBeInTheDocument();
    });

    it('빈 배열이면 아무것도 렌더링하지 않는다', () => {
        const { container } = render(<HostTopicTags topics={[]} />);

        expect(container.innerHTML).toBe('');
    });
});
