import type { Step1Data } from './RegisterStep1';
import type { Step2Data } from './RegisterStep2';

interface RegisterStep3Props {
    step1: Step1Data;
    step2: Step2Data;
    isPending: boolean;
    error: Error | null;
    isSuccess: boolean;
    tokenRefreshFailed?: boolean;
    onSubmit: () => void;
}

function CheckCircleIcon({ className = '' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="3" />
            <path d="M14 24L21 31L34 17" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export default function RegisterStep3({ step1, step2, isPending, error, isSuccess, tokenRefreshFailed, onSubmit }: RegisterStep3Props) {
    if (isSuccess) {
        return (
            <div className="w-full max-w-lg mx-auto text-center">
                <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-6" />
                <h2 className="text-2xl md:text-3xl font-bold text-[var(--cohe-text-dark)] mb-3">
                    호스트 등록 완료!
                </h2>
                <p className="text-[var(--cohe-text-dark)]/70 mb-8">
                    캘린더가 성공적으로 생성되었습니다. 이제 예약 가능 시간을 설정해보세요.
                </p>
                {tokenRefreshFailed && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-left">
                        <p className="text-sm text-amber-700">
                            호스트 등록은 완료되었으나 세션 갱신에 실패했습니다.
                            모든 기능을 사용하려면 <strong>재로그인</strong>이 필요합니다.
                        </p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--cohe-text-dark)] mb-2">
                등록 정보 확인
            </h2>
            <p className="text-[var(--cohe-text-dark)]/70 mb-8">
                입력한 내용을 확인하고 등록을 완료해주세요.
            </p>

            {/* Summary cards */}
            <div className="space-y-4 mb-8">
                {/* Topics */}
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">미팅 주제</h3>
                    <div className="flex flex-wrap gap-2">
                        {step1.topics.map((topic) => (
                            <span
                                key={topic}
                                className="px-3 py-1.5 bg-[var(--cohe-primary)]/10 text-[var(--cohe-primary)] rounded-full text-sm font-medium"
                            >
                                {topic}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Description */}
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">소개</h3>
                    <p className="text-[var(--cohe-text-dark)] whitespace-pre-wrap">{step1.description}</p>
                </div>

                {/* Google Calendar */}
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">Google Calendar ID</h3>
                    <p className="text-[var(--cohe-text-dark)] break-all">
                        {step2.googleCalendarId}
                    </p>
                </div>
            </div>

            {/* Role change notice */}
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                <span className="text-amber-500 text-lg leading-none mt-0.5">!</span>
                <p className="text-sm text-amber-700">
                    호스트로 등록하면 계정 역할이 <strong>게스트에서 호스트로 전환</strong>됩니다.
                    등록 후에는 호스트 대시보드에서 예약 가능 시간을 설정할 수 있습니다.
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error.message}</p>
                </div>
            )}

            {/* Submit */}
            <button
                type="button"
                onClick={onSubmit}
                disabled={isPending}
                className={`w-full py-3.5 rounded-lg font-semibold text-lg transition-colors ${
                    isPending
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'cohe-btn-primary'
                }`}
            >
                {isPending ? '등록 중...' : '호스트 등록 완료'}
            </button>
        </div>
    );
}
