import { useState } from 'react';
import Button from '~/components/button/Button';
import { useAuth } from '../hooks/useAuth';
import { useUpdateMember } from '../hooks/useUpdateMember';
import { useFormValidation, type ValidationRule } from '../hooks/useFormValidation';
import { getErrorMessage } from '~/libs/errorUtils';

interface ProfileFormValues {
    displayName: string;
}

const validationRules: Record<keyof ProfileFormValues, ValidationRule<string>> = {
    displayName: (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) return '표시 이름을 입력해주세요.';
        if (trimmed.length < 2 || trimmed.length > 20) {
            return '표시 이름은 2~20자여야 합니다.';
        }
        return null;
    },
};

export function ProfileEditForm() {
    const { data: user } = useAuth();
    const [displayName, setDisplayName] = useState(user?.displayName ?? '');
    const [successMessage, setSuccessMessage] = useState('');
    const mutation = useUpdateMember(user?.username ?? '');

    const { fields, handleBlur, validateAll, getInputClassName } =
        useFormValidation<ProfileFormValues>(validationRules);

    const baseInputClass =
        'w-full px-4 py-3 border rounded-lg focus:outline-none transition-colors';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMessage('');

        const values: ProfileFormValues = { displayName: displayName.trim() };
        if (!validateAll(values)) return;

        mutation.mutate(
            { displayName: displayName.trim() },
            {
                onSuccess: () => {
                    setSuccessMessage('표시 이름이 변경되었습니다.');
                },
            }
        );
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" data-testid="profile-edit-form">
            <h3 className="text-lg font-semibold text-[var(--cohe-text-dark)]">표시 이름 변경</h3>

            <div className="flex flex-col gap-1">
                <label htmlFor="displayName" className="text-sm text-[var(--cohe-text-dark)]">
                    표시 이름
                </label>
                <input
                    type="text"
                    id="displayName"
                    data-testid="display-name-input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    onBlur={() => handleBlur('displayName', displayName)}
                    disabled={mutation.isPending}
                    maxLength={20}
                    placeholder="(2-20자)"
                    className={getInputClassName('displayName', baseInputClass)}
                />
                {fields.displayName?.touched && fields.displayName.error && (
                    <span className="text-xs text-red-500 mt-1">{fields.displayName.error}</span>
                )}
            </div>

            {mutation.isError && (
                <div className="text-red-600 text-sm">
                    {getErrorMessage(mutation.error, '표시 이름 변경에 실패했습니다.')}
                </div>
            )}

            {successMessage && (
                <div className="text-green-600 text-sm" data-testid="profile-success-message">
                    {successMessage}
                </div>
            )}

            <Button
                variant="primary"
                type="submit"
                disabled={mutation.isPending}
                className="w-full rounded-lg"
            >
                {mutation.isPending ? '변경 중...' : '변경하기'}
            </Button>
        </form>
    );
}
