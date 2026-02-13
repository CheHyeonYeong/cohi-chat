import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { usePasswordResetRequest } from '../hooks/usePasswordReset';

function CoffeeCupIcon({ className = '' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 21V19H20V21H2ZM4 18C3.45 18 2.979 17.804 2.587 17.412C2.195 17.02 1.99933 16.5493 2 16V5H18V9H20C20.55 9 21.021 9.196 21.413 9.588C21.805 9.98 22.0007 10.4507 22 11V14C22 14.55 21.804 15.021 21.412 15.413C21.02 15.805 20.5493 16.0007 20 16H18V18H4ZM18 14H20V11H18V14ZM4 16H16V7H4V16Z"/>
            <path d="M7 4C7 3.5 7.5 2 9 2C10.5 2 11 3.5 11 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
    );
}

export function PasswordResetRequestForm() {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const resetMutation = usePasswordResetRequest();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        resetMutation.mutate(
            { email: email.trim().toLowerCase() },
            {
                onSuccess: () => setIsSubmitted(true),
            }
        );
    };

    const isPending = resetMutation.isPending;

    if (isSubmitted) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--cohe-bg-warm)]">
                <div className="flex items-center gap-2 mb-8">
                    <CoffeeCupIcon className="w-10 h-10 text-[var(--cohe-primary)]" />
                    <span className="text-2xl font-bold text-[var(--cohe-text-dark)]">coheChat</span>
                </div>

                <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-[var(--cohe-text-dark)] mb-4">이메일을 확인해주세요</h2>
                    <p className="text-gray-600 mb-6">
                        입력하신 이메일 주소로 비밀번호 재설정 링크를 발송했습니다.
                        <br />
                        <span className="text-sm text-gray-500">(이메일이 등록되어 있는 경우에만 발송됩니다)</span>
                    </p>
                    <Link
                        to="/app/login"
                        className="inline-block w-full py-3 bg-[var(--cohe-primary)] text-white font-semibold rounded-lg hover:bg-[var(--cohe-primary-dark)] transition-colors"
                    >
                        로그인으로 돌아가기
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--cohe-bg-warm)]">
            <div className="flex items-center gap-2 mb-8">
                <CoffeeCupIcon className="w-10 h-10 text-[var(--cohe-primary)]" />
                <span className="text-2xl font-bold text-[var(--cohe-text-dark)]">coheChat</span>
            </div>

            <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-center text-[var(--cohe-text-dark)] mb-2">비밀번호 재설정</h2>
                <p className="text-center text-gray-500 text-sm mb-6">
                    가입하신 이메일 주소를 입력해주세요.
                    <br />
                    비밀번호 재설정 링크를 보내드립니다.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="email" className="text-sm text-[var(--cohe-text-dark)]">이메일</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isPending}
                            required
                            placeholder="example@email.com"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[var(--cohe-primary)] transition-colors"
                        />
                    </div>

                    {resetMutation.isError && (
                        <div className="text-red-600 text-sm">
                            {resetMutation.error?.message || '요청에 실패했습니다. 다시 시도해주세요.'}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full py-3 bg-[var(--cohe-primary)] text-white font-semibold rounded-lg hover:bg-[var(--cohe-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {isPending ? '처리 중...' : '재설정 링크 받기'}
                    </button>
                </form>

                <div className="text-center text-sm mt-6 text-[var(--cohe-text-dark)]">
                    <Link to="/app/login" className="text-[var(--cohe-primary)] font-semibold hover:underline">
                        로그인으로 돌아가기
                    </Link>
                </div>
            </div>
        </div>
    );
}
