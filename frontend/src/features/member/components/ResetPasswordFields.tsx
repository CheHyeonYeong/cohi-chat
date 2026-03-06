import { useState, useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import Button from '~/components/button/Button';
import { useFormValidation } from '../hooks/useFormValidation';
import { useConfirmPasswordReset } from '../hooks/usePasswordReset';
import { validatePassword, validatePasswordConfirm } from '../utils/validators';
import { getErrorMessage, isHttpError } from '~/libs/errorUtils';

interface ResetPasswordFieldsValues {
    password: string;
    passwordAgain: string;
}

interface ResetPasswordFieldsProps {
    token: string;
    onSuccess: () => void;
}

export function ResetPasswordFields({ token, onSuccess }: ResetPasswordFieldsProps) {
    const [password, setPassword] = useState('');
    const [passwordAgain, setPasswordAgain] = useState('');
    const confirmMutation = useConfirmPasswordReset();

    const validationRules = {
        password: validatePassword(),
        passwordAgain: validatePasswordConfirm(() => password),
    };
    const { fields, handleBlur, validateAll, getInputClassName } =
        useFormValidation<ResetPasswordFieldsValues>(validationRules);

    const onBlur = useCallback(
        (name: keyof ResetPasswordFieldsValues, value: string) => {
            handleBlur(name, value);
        },
        [handleBlur]
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const values: ResetPasswordFieldsValues = { password, passwordAgain };
        if (!validateAll(values)) return;

        confirmMutation.mutate(
            { token, password },
            { onSuccess }
        );
    };

    const isPending = confirmMutation.isPending;
    const baseInputClass =
        'w-full px-4 py-3 border rounded-lg focus:outline-none transition-colors';

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" data-testid="reset-password-form">
            <div className="flex flex-col gap-1">
                <label htmlFor="password" className="text-sm text-[var(--cohi-text-dark)]">
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
                <label htmlFor="passwordAgain" className="text-sm text-[var(--cohi-text-dark)]">
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
                    <p>{getErrorMessage(confirmMutation.error, '비밀번호 재설정에 실패했습니다.')}</p>
                    {isHttpError(confirmMutation.error, 401) && (
                        <Link
                            to="/forgot-password"
                            className="block mt-2 text-[var(--cohi-primary)] font-semibold hover:underline"
                        >
                            비밀번호 찾기로 이동
                        </Link>
                    )}
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
    );
}
