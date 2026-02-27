/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import FileDropZone from './FileDropZone';

describe('FileDropZone', () => {
    afterEach(() => cleanup());

    it('기본 안내 문구를 렌더링해야 한다', () => {
        const { container } = render(<FileDropZone onFilesDropped={vi.fn()} />);
        expect(container.textContent).toContain('파일을 드래그하거나 클릭하여 업로드');
    });

    it('dragover 시 활성화 스타일을 적용해야 한다', () => {
        const { getByTestId } = render(<FileDropZone onFilesDropped={vi.fn()} />);
        const zone = getByTestId('file-drop-zone');
        fireEvent.dragOver(zone, { dataTransfer: { types: ['Files'] } });
        expect(zone.className).toContain('border-[var(--cohe-primary)]');
    });

    it('dragleave 시 활성화 스타일이 제거돼야 한다', () => {
        const { getByTestId } = render(<FileDropZone onFilesDropped={vi.fn()} />);
        const zone = getByTestId('file-drop-zone');
        fireEvent.dragOver(zone, { dataTransfer: { types: ['Files'] } });
        fireEvent.dragLeave(zone);
        expect(zone.className).not.toContain('border-[var(--cohe-primary)]');
    });

    it('drop 시 onFilesDropped 콜백이 FileList와 함께 호출돼야 한다', () => {
        const onFilesDropped = vi.fn();
        const { getByTestId } = render(<FileDropZone onFilesDropped={onFilesDropped} />);
        const zone = getByTestId('file-drop-zone');

        const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
        const dt = { files: [file], types: ['Files'] };

        fireEvent.drop(zone, { dataTransfer: dt });
        expect(onFilesDropped).toHaveBeenCalledOnce();
    });

    it('disabled이면 dragover 스타일 변경이 없어야 한다', () => {
        const { getByTestId } = render(<FileDropZone onFilesDropped={vi.fn()} disabled />);
        const zone = getByTestId('file-drop-zone');
        fireEvent.dragOver(zone, { dataTransfer: { types: ['Files'] } });
        expect(zone.className).not.toContain('border-[var(--cohe-primary)]');
    });

    it('파일 선택(change) 시 onFilesDropped 콜백이 호출돼야 한다', () => {
        const onFilesDropped = vi.fn();
        const { container } = render(<FileDropZone onFilesDropped={onFilesDropped} />);
        const input = container.querySelector('input[type="file"]')!;

        const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
        fireEvent.change(input, { target: { files: [file] } });

        expect(onFilesDropped).toHaveBeenCalledOnce();
    });

    it('disabled이면 파일 선택 시 onFilesDropped 콜백이 호출되지 않아야 한다', () => {
        const onFilesDropped = vi.fn();
        const { getByTestId } = render(<FileDropZone onFilesDropped={onFilesDropped} disabled />);
        const zone = getByTestId('file-drop-zone');

        fireEvent.click(zone);

        expect(onFilesDropped).not.toHaveBeenCalled();
    });
});
