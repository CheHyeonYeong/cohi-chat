import { useState, useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import Button from '~/components/button/Button';
import CoffeeCupIcon from '~/components/icons/CoffeeCupIcon';
import { useFormValidation, type ValidationRule } from '~/features/member/hooks/useFormValidation';
import { useRequestPasswordReset } from '~/features/member/hooks/usePasswordReset';
import { getErrorMessage } from '~/libs/errorUtils';

interface ForgotPasswordFormValues {
    email: string;
}

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const validationRules: Record<keyof ForgotPasswordFormValues, ValidationRule<string>> = {
    email: (value: string) => {
        if (!value.trim()) return '이메일을 입력해주세요.';
        if (!EMAIL_PATTERN.test(value.trim())) return '올바른 이메일 형식이 아닙니다.';
        return null;
    },
};

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const requestMutation = useRequestPasswordReset();
    const { fields, handleBlur, validateAll, getInputClassName } =
        useFormValidation<ForgotPasswordFormValues>(validationRules);

    const onBlur = useCallback(
        (name: keyof ForgotPasswordFormValues, value: string) => {
            handleBlur(name, value);
        },
        [handleBlur]
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const values: ForgotPasswordFormValues = { email: email.trim() };
        if (!validateAll(values)) return;

        requestMutation.mutate(email.trim(), {
            onSuccess: () => setSubmitted(true),
        });
    };

    const isPending = requestMutation.isPending;
    const baseInputClass =
        'w-full px-4 py-3 border rounded-lg focus:outline-none transition-colors';

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--cohe-bg-warm)]">
            <Link to="/" className="flex items-center gap-2 mb-8">
                <CoffeeCupIcon className="w-10 h-10 text-[var(--cohe-primary)]" />
                <span className="text-2xl font-bold text-[var(--cohe-text-dark)]">coheChat</span>
            </Link>

            <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-center text-[var(--cohe-text-dark)] mb-6">
                    비밀번호 찾기
                </h2>

                {submitted ? (
                    <div data-testid="forgot-password-success">
                        <p className="text-sm text-center text-[var(--cohe-text-dark)] mb-6">
                            입력하신 이메일로 비밀번호 재설정 링크를 발송했습니다.
                            이메일을 확인해주세요.
                        </p>
                        <Link
                            to="/login"
                            className="block text-center text-[var(--cohe-primary)] font-semibold hover:underline"
                        >
                            로그인으로 돌아가기
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <label htmlFor="email" className="text-sm text-[var(--cohe-text-dark)]">
                                이메일
                            </label>
                            <input
                                type="email"
                                id="email"
                                data-testid="forgot-password-email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onBlur={() => onBlur('email', email)}
                                disabled={isPending}
                                required
                                placeholder="가입한 이메일 주소를 입력하세요"
                                className={getInputClassName('email', baseInputClass)}
                            />
                            {fields.email?.touched && fields.email.error && (
                                <span className="text-xs text-red-500 mt-1">{fields.email.error}</span>
                            )}
                        </div>

                        {requestMutation.isError && (
                            <div className="text-red-600 text-sm">
                                {getErrorMessage(requestMutation.error, '요청에 실패했습니다.')}
                            </div>
                        )}

                        <Button
                            variant="primary"
                            size="lg"
                            type="submit"
                            disabled={isPending}
                            className="w-full rounded-lg mt-2"
                            data-testid="forgot-password-submit"
                        >
                            {isPending ? '전송 중...' : '재설정 링크 받기'}
                        </Button>

                        <div className="text-center text-sm mt-2 text-[var(--cohe-text-dark)]">
                            <Link
                                to="/login"
                                className="text-[var(--cohe-primary)] font-semibold hover:underline"
                            >
                                로그인으로 돌아가기
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
