import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import Button from '~/components/button/Button';
import CoffeeCupIcon from '~/components/icons/CoffeeCupIcon';
import { useRequestPasswordReset } from '~/features/member';
import { getErrorMessage } from '~/libs/errorUtils';

export default function PasswordResetRequestPage() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const mutation = useRequestPasswordReset();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(email, {
            onSuccess: () => setSubmitted(true),
        });
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--cohe-bg-warm)]">
            <Link to='/' className="flex items-center gap-2 mb-8">
                <CoffeeCupIcon className="w-10 h-10 text-[var(--cohe-primary)]" />
                <span className="text-2xl font-bold text-[var(--cohe-text-dark)]">coheChat</span>
            </Link>

            <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
                {submitted ? (
                    <div className="text-center space-y-4">
                        <p className="text-lg font-semibold text-[var(--cohe-text-dark)]">이메일을 확인해주세요</p>
                        <p className="text-sm text-gray-500">
                            비밀번호 재설정 링크를 <strong>{email}</strong>으로 발송했습니다.<br />
                            링크는 30분 동안 유효합니다.
                        </p>
                        <Link to="/login" className="block text-sm text-[var(--cohe-primary)] font-semibold hover:underline mt-4">
                            로그인으로 돌아가기
                        </Link>
                    </div>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold text-center text-[var(--cohe-text-dark)] mb-2">비밀번호 재설정</h2>
                        <p className="text-sm text-gray-500 text-center mb-6">
                            가입 시 사용한 이메일을 입력하면 재설정 링크를 보내드립니다.
                        </p>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <label htmlFor="email" className="text-sm text-[var(--cohe-text-dark)]">이메일</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={mutation.isPending}
                                    required
                                    placeholder="example@email.com"
                                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[var(--cohe-primary)] transition-colors"
                                />
                            </div>

                            {mutation.isError && (
                                <p className="text-sm text-red-600">
                                    {getErrorMessage(mutation.error, '요청에 실패했습니다.')}
                                </p>
                            )}

                            <Button
                                variant="primary"
                                size="lg"
                                type="submit"
                                loading={mutation.isPending}
                                className="w-full rounded-lg mt-2"
                            >
                                재설정 링크 보내기
                            </Button>
                        </form>

                        <div className="text-center text-sm mt-6">
                            <Link to="/login" className="text-[var(--cohe-primary)] font-semibold hover:underline">
                                로그인으로 돌아가기
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
