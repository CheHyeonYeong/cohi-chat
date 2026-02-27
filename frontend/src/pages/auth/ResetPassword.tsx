import { useState, useCallback, useEffect, useRef } from 'react';
import { Link, useSearch } from '@tanstack/react-router';
import Button from '~/components/button/Button';
import CoffeeCupIcon from '~/components/icons/CoffeeCupIcon';
import { useFormValidation, type ValidationRule } from '~/features/member/hooks/useFormValidation';
import { useVerifyResetToken, useConfirmPasswordReset } from '~/features/member/hooks/usePasswordReset';
import { getErrorMessage } from '~/libs/errorUtils';

interface ResetPasswordFormValues {
    password: string;
    passwordAgain: string;
}

const PASSWORD_PATTERN = /^[a-zA-Z0-9!@#$%^&*._-]{8,20}$/;

const createValidationRules = (
    getPassword: () => string
): Record<keyof ResetPasswordFormValues, ValidationRule<string>> => ({
    password: (value: string) => {
        if (!value) return '비밀번호를 입력해주세요.';
        if (!PASSWORD_PATTERN.test(value)) {
            return '비밀번호는 8~20자의 영문, 숫자, 특수문자(!@#$%^&*._-)만 가능합니다.';
        }
        return null;
    },
    passwordAgain: (value: string) => {
        if (!value) return '비밀번호 확인을 입력해주세요.';
        if (value !== getPassword()) {
            return '비밀번호가 일치하지 않습니다.';
        }
        return null;
    },
});

export default function ResetPassword() {
    const { token } = useSearch({ from: '/reset-password' });
    const [password, setPassword] = useState('');
    const [passwordAgain, setPasswordAgain] = useState('');
    const [resetSuccess, setResetSuccess] = useState(false);

    const verifyMutation = useVerifyResetToken();
    const confirmMutation = useConfirmPasswordReset();

    const validationRules = createValidationRules(() => password);
    const { fields, handleBlur, validateAll, getInputClassName } =
        useFormValidation<ResetPasswordFormValues>(validationRules);

    const onBlur = useCallback(
        (name: keyof ResetPasswordFormValues, value: string) => {
            handleBlur(name, value);
        },
        [handleBlur]
    );

    const verifiedTokenRef = useRef<string | null>(null);
    useEffect(() => {
        if (token && verifiedTokenRef.current !== token) {
            verifiedTokenRef.current = token;
            verifyMutation.mutate(token);
        }
    }, [token, verifyMutation]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        const values: ResetPasswordFormValues = { password, passwordAgain };
        if (!validateAll(values)) return;

        confirmMutation.mutate(
            { token, password },
            { onSuccess: () => setResetSuccess(true) }
        );
    };

    const isPending = confirmMutation.isPending;
    const baseInputClass =
        'w-full px-4 py-3 border rounded-lg focus:outline-none transition-colors';

    const isTokenValid = verifyMutation.isSuccess && verifyMutation.data?.valid;
    const isTokenInvalid =
        !token || verifyMutation.isError || (verifyMutation.isSuccess && !verifyMutation.data?.valid);
    const isVerifying = verifyMutation.isPending;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--cohe-bg-warm)]">
            <Link to="/" className="flex items-center gap-2 mb-8">
                <CoffeeCupIcon className="w-10 h-10 text-[var(--cohe-primary)]" />
                <span className="text-2xl font-bold text-[var(--cohe-text-dark)]">coheChat</span>
            </Link>

            <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-center text-[var(--cohe-text-dark)] mb-6">
                    비밀번호 재설정
                </h2>

                {isVerifying && (
                    <p className="text-sm text-center text-gray-500" data-testid="reset-password-verifying">
                        토큰을 확인하고 있습니다...
                    </p>
                )}

                {isTokenInvalid && !isVerifying && (
                    <div data-testid="reset-password-invalid-token">
                        <p className="text-sm text-center text-red-600 mb-6">
                            유효하지 않거나 만료된 링크입니다.
                            비밀번호 재설정을 다시 요청해주세요.
                        </p>
                        <Link
                            to="/forgot-password"
                            className="block text-center text-[var(--cohe-primary)] font-semibold hover:underline"
                        >
                            비밀번호 찾기로 이동
                        </Link>
                    </div>
                )}

                {resetSuccess && (
                    <div data-testid="reset-password-success">
                        <p className="text-sm text-center text-[var(--cohe-text-dark)] mb-6">
                            비밀번호가 성공적으로 변경되었습니다.
                            새 비밀번호로 로그인해주세요.
                        </p>
                        <Link
                            to="/login"
                            className="block text-center text-[var(--cohe-primary)] font-semibold hover:underline"
                        >
                            로그인으로 이동
                        </Link>
                    </div>
                )}

                {isTokenValid && !resetSuccess && (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4" data-testid="reset-password-form">
                        <div className="flex flex-col gap-1">
                            <label htmlFor="password" className="text-sm text-[var(--cohe-text-dark)]">
                                새 비밀번호
                            </label>
                            <input
                                type="password"
                                id="password"
                                data-testid="reset-password-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onBlur={() => onBlur('password', password)}
                                disabled={isPending}
                                required
                                minLength={8}
                                maxLength={20}
                                placeholder="(8-20자)"
                                className={getInputClassName('password', baseInputClass)}
                            />
                            {fields.password?.touched && fields.password.error && (
                                <span className="text-xs text-red-500 mt-1">{fields.password.error}</span>
                            )}
                        </div>

                        <div className="flex flex-col gap-1">
                            <label htmlFor="passwordAgain" className="text-sm text-[var(--cohe-text-dark)]">
                                새 비밀번호 확인
                            </label>
                            <input
                                type="password"
                                id="passwordAgain"
                                data-testid="reset-password-confirm-input"
                                value={passwordAgain}
                                onChange={(e) => setPasswordAgain(e.target.value)}
                                onBlur={() => onBlur('passwordAgain', passwordAgain)}
                                disabled={isPending}
                                required
                                minLength={8}
                                maxLength={20}
                                placeholder="비밀번호 확인"
                                className={getInputClassName('passwordAgain', baseInputClass)}
                            />
                            {fields.passwordAgain?.touched && fields.passwordAgain.error && (
                                <span className="text-xs text-red-500 mt-1">{fields.passwordAgain.error}</span>
                            )}
                        </div>

                        {confirmMutation.isError && (
                            <div className="text-red-600 text-sm">
                                {getErrorMessage(confirmMutation.error, '비밀번호 재설정에 실패했습니다.')}
                            </div>
                        )}

                        <Button
                            variant="primary"
                            size="lg"
                            type="submit"
                            disabled={isPending}
                            className="w-full rounded-lg mt-2"
                            data-testid="reset-password-submit"
                        >
                            {isPending ? '변경 중...' : '비밀번호 변경'}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
}
