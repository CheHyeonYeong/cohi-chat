import { useState } from 'react';
import Button from '~/components/button/Button';
import { useAuth } from '../hooks/useAuth';
import { useUpdateMember } from '../hooks/useUpdateMember';
import { useFormValidation, type ValidationRule } from '../hooks/useFormValidation';
import { getErrorMessage } from '~/libs/errorUtils';

const PASSWORD_PATTERN = /^[a-zA-Z0-9!@#$%^&*._-]{8,20}$/;

interface PasswordFormValues {
    newPassword: string;
    confirmPassword: string;
}

const createValidationRules = (
    getNewPassword: () => string
): Record<keyof PasswordFormValues, ValidationRule<string>> => ({
    newPassword: (value: string) => {
        if (!value) return '새 비밀번호를 입력해주세요.';
        if (!PASSWORD_PATTERN.test(value)) {
            return '비밀번호는 8~20자의 영문, 숫자, 특수문자(!@#$%^&*._-)만 가능합니다.';
        }
        return null;
    },
    confirmPassword: (value: string) => {
        if (!value) return '비밀번호 확인을 입력해주세요.';
        if (value !== getNewPassword()) {
            return '비밀번호가 일치하지 않습니다.';
        }
        return null;
    },
});

export function PasswordChangeForm() {
    const { data: user } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const mutation = useUpdateMember(user?.username ?? '');

    const validationRules = createValidationRules(() => newPassword);
    const { fields, handleBlur, validateAll, getInputClassName } =
        useFormValidation<PasswordFormValues>(validationRules);

    const baseInputClass =
        'w-full px-4 py-3 border rounded-lg focus:outline-none transition-colors';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMessage('');

        const values: PasswordFormValues = { newPassword, confirmPassword };
        if (!validateAll(values)) return;

        mutation.mutate(
            { password: newPassword },
            {
                onSuccess: () => {
                    setNewPassword('');
                    setConfirmPassword('');
                    setSuccessMessage('비밀번호가 변경되었습니다.');
                },
            }
        );
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" data-testid="password-change-form">
            <h3 className="text-lg font-semibold text-[var(--cohe-text-dark)]">비밀번호 변경</h3>

            <div className="flex flex-col gap-1">
                <label htmlFor="newPassword" className="text-sm text-[var(--cohe-text-dark)]">
                    새 비밀번호
                </label>
                <input
                    type="password"
                    id="newPassword"
                    data-testid="new-password-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onBlur={() => handleBlur('newPassword', newPassword)}
                    disabled={mutation.isPending}
                    minLength={8}
                    maxLength={20}
                    placeholder="(8-20자)"
                    className={getInputClassName('newPassword', baseInputClass)}
                />
                {fields.newPassword?.touched && fields.newPassword.error && (
                    <span className="text-xs text-red-500 mt-1">{fields.newPassword.error}</span>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <label htmlFor="confirmPassword" className="text-sm text-[var(--cohe-text-dark)]">
                    비밀번호 확인
                </label>
                <input
                    type="password"
                    id="confirmPassword"
                    data-testid="confirm-password-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={() => handleBlur('confirmPassword', confirmPassword)}
                    disabled={mutation.isPending}
                    minLength={8}
                    maxLength={20}
                    placeholder="비밀번호 확인"
                    className={getInputClassName('confirmPassword', baseInputClass)}
                />
                {fields.confirmPassword?.touched && fields.confirmPassword.error && (
                    <span className="text-xs text-red-500 mt-1">{fields.confirmPassword.error}</span>
                )}
            </div>

            {mutation.isError && (
                <div className="text-red-600 text-sm">
                    {getErrorMessage(mutation.error, '비밀번호 변경에 실패했습니다.')}
                </div>
            )}

            {successMessage && (
                <div className="text-green-600 text-sm" data-testid="password-success-message">
                    {successMessage}
                </div>
            )}

            <Button
                variant="primary"
                type="submit"
                disabled={mutation.isPending}
                className="w-full rounded-lg"
            >
                {mutation.isPending ? '변경 중...' : '비밀번호 변경'}
            </Button>
        </form>
    );
}
