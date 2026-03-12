import { useState, useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import Button from '~/components/button/Button';
import { useFormValidation, type ValidationRule } from '../hooks/useFormValidation';
import { useRequestPasswordReset } from '../hooks/usePasswordReset';
import { validateEmail } from '../utils/validators';
import { getErrorMessage } from '~/libs/errorUtils';

interface ForgotPasswordEmailFormValues {
    email: string;
}

const validationRules: Record<keyof ForgotPasswordEmailFormValues, ValidationRule<string>> = {
    email: validateEmail,
};

interface ForgotPasswordEmailFormProps {
    onSuccess: () => void;
}

export function ForgotPasswordEmailForm({ onSuccess }: ForgotPasswordEmailFormProps) {
    const [email, setEmail] = useState('');
    const requestMutation = useRequestPasswordReset();
    const { fields, handleBlur, validateAll, getInputClassName } =
        useFormValidation<ForgotPasswordEmailFormValues>(validationRules);

    const onBlur = useCallback(
        (name: keyof ForgotPasswordEmailFormValues, value: string) => {
            handleBlur(name, value);
        },
        [handleBlur]
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const values: ForgotPasswordEmailFormValues = { email: email.trim() };
        if (!validateAll(values)) return;

        requestMutation.mutate(email.trim(), {
            onSuccess,
        });
    };

    const isPending = requestMutation.isPending;
    const baseInputClass =
        'w-full px-4 py-3 border rounded-lg focus:outline-none transition-colors';

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <label htmlFor="email" className="text-sm text-[var(--cohi-text-dark)]">
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

            <div className="text-center text-sm mt-2 text-[var(--cohi-text-dark)]">
                <Link
                    to="/login"
                    className="text-[var(--cohi-primary)] font-semibold hover:underline"
                >
                    로그인으로 돌아가기
                </Link>
            </div>
        </form>
    );
}
