import { useState } from 'react';
import { Button } from '~/components/button';

interface NoShowReportModalProps {
    title: string;
    isPending: boolean;
    onSubmit: (reason?: string) => void;
    onClose: () => void;
}

export default function NoShowReportModal({ title, isPending, onSubmit, onClose }: NoShowReportModalProps) {
    const [reason, setReason] = useState('');

    const handleSubmit = () => {
        onSubmit(reason.trim() || undefined);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="noshow-report-title"
                className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 id="noshow-report-title" className="text-lg font-semibold text-[var(--cohi-text-dark)] mb-4">{title}</h2>

                <label htmlFor="noshow-reason" className="sr-only">신고 사유</label>
                <textarea
                    id="noshow-reason"
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--cohi-primary)]/30 focus:border-[var(--cohi-primary)]"
                    rows={3}
                    placeholder="신고 사유를 입력해주세요 (선택)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                />

                <div className="flex gap-2 mt-4">
                    <Button
                        type="button"
                        variant="primary"
                        loading={isPending}
                        onClick={handleSubmit}
                        className="flex-1 rounded-xl"
                    >
                        신고하기
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1 rounded-xl"
                    >
                        취소
                    </Button>
                </div>
            </div>
        </div>
    );
}
