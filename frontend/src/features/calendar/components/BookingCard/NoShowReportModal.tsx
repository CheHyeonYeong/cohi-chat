import { useState } from 'react';
import { Button } from '~/components/button';

interface ReportModalProps {
    isPending: boolean;
    defaultNickname?: string;
    onSubmit: (nickname: string, reason: string) => void;
    onClose: () => void;
}

export default function NoShowReportModal({ isPending, defaultNickname = '', onSubmit, onClose }: ReportModalProps) {
    const [nickname, setNickname] = useState(defaultNickname);
    const [reason, setReason] = useState('');

    const isReasonEmpty = reason.trim() === '';

    const handleSubmit = () => {
        if (isReasonEmpty) return;
        onSubmit(nickname.trim(), reason.trim());
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="report-title"
                className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 id="report-title" className="text-lg font-semibold text-[var(--cohi-text-dark)] mb-4">신고하기</h2>

                <div className="flex flex-col gap-3">
                    <div>
                        <label htmlFor="report-nickname" className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
                        <input
                            id="report-nickname"
                            type="text"
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cohi-primary)]/30 focus:border-[var(--cohi-primary)]"
                            placeholder="신고 대상 닉네임"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="report-reason" className="block text-sm font-medium text-gray-700 mb-1">
                            신고 사유 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="report-reason"
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--cohi-primary)]/30 focus:border-[var(--cohi-primary)]"
                            rows={3}
                            placeholder="신고 사유를 입력해주세요 (필수)"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-2 mt-4">
                    <Button
                        type="button"
                        variant="primary"
                        loading={isPending}
                        disabled={isReasonEmpty}
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
