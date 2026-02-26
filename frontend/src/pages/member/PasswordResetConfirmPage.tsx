import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import Button from '~/components/button/Button';
import CoffeeCupIcon from '~/components/icons/CoffeeCupIcon';
import { useVerifyResetToken, useConfirmPasswordReset } from '~/features/member';
import { getErrorMessage } from '~/libs/errorUtils';

export default function PasswordResetConfirmPage() {
    const { token } = useSearch({ from: '/password-reset/confirm' });
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    const verifyMutation = useVerifyResetToken();
    const confirmMutation = useConfirmPasswordReset();

    useEffect(() => {
        if (token) {
            verifyMutation.mutate(token);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);

        if (newPassword.length < 8) {
            setPasswordError('비밀번호는 최소 8자 이상이어야 합니다.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('비밀번호가 일치하지 않습니다.');
            return;
        }

        confirmMutation.mutate(
            { token: token ?? '', newPassword },
            {
                onSuccess: () => setDone(true),
            }
        );
    };

    if (!token) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--cohe-bg-warm)]">
                <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
                    <p className="text-red-500 font-semibold">유효하지 않은 링크입니다.</p>
                    <Link to="/password-reset" className="text-sm text-[var(--cohe-primary)] font-semibold hover:underline">
                        비밀번호 재설정 다시 요청하기
                    </Link>
                </div>
            </div>
        );
    }

    if (verifyMutation.isPending) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--cohe-bg-warm)]">
                <p className="text-gray-500">링크를 확인하는 중...</p>
            </div>
        );
    }

    if (verifyMutation.isError) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--cohe-bg-warm)]">
                <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
                    <p className="text-red-500 font-semibold">링크가 만료되었거나 유효하지 않습니다.</p>
                    <Link to="/password-reset" className="text-sm text-[var(--cohe-primary)] font-semibold hover:underline">
                        비밀번호 재설정 다시 요청하기
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--cohe-bg-warm)]">
            <Link to='/' className="flex items-center gap-2 mb-8">
                <CoffeeCupIcon className="w-10 h-10 text-[var(--cohe-primary)]" />
                <span className="text-2xl font-bold text-[var(--cohe-text-dark)]">coheChat</span>
            </Link>

            <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
                {done ? (
                    <div className="text-center space-y-4">
                        <p className="text-lg font-semibold text-[var(--cohe-text-dark)]">비밀번호가 변경되었습니다</p>
                        <p className="text-sm text-gray-500">새 비밀번호로 로그인해주세요.</p>
                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full rounded-lg mt-2"
                            onClick={() => navigate({ to: '/login' })}
                        >
                            로그인하기
                        </Button>
                    </div>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold text-center text-[var(--cohe-text-dark)] mb-6">새 비밀번호 설정</h2>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <label htmlFor="newPassword" className="text-sm text-[var(--cohe-text-dark)]">새 비밀번호</label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={confirmMutation.isPending}
                                    required
                                    placeholder="8자 이상 입력"
                                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[var(--cohe-primary)] transition-colors"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label htmlFor="confirmPassword" className="text-sm text-[var(--cohe-text-dark)]">비밀번호 확인</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={confirmMutation.isPending}
                                    required
                                    placeholder="비밀번호 재입력"
                                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[var(--cohe-primary)] transition-colors"
                                />
                            </div>

                            {(passwordError || confirmMutation.isError) && (
                                <p className="text-sm text-red-600">
                                    {passwordError ?? getErrorMessage(confirmMutation.error, '비밀번호 변경에 실패했습니다.')}
                                </p>
                            )}

                            <Button
                                variant="primary"
                                size="lg"
                                type="submit"
                                loading={confirmMutation.isPending}
                                className="w-full rounded-lg mt-2"
                            >
                                비밀번호 변경하기
                            </Button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
