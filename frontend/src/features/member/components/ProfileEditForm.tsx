import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Button } from '~/components/button';
import { useAuth } from '../hooks/useAuth';
import { useUpdateMember } from '../hooks/useUpdateMember';
import { useProfileValidation, type ProfileFormValues } from '../hooks/useProfileValidation';
import { getErrorMessage } from '~/libs/errorUtils';

export function ProfileEditForm() {
    const { data: user } = useAuth();
    const username = user?.username;
    const [displayName, setDisplayName] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const mutation = useUpdateMember(username ?? '');

    useEffect(() => {
        setDisplayName(user?.displayName ?? '');
    }, [user?.displayName]);

    const { fields, handleBlur, validateAll, getInputClassName } =
        useProfileValidation();

    const baseInputClass =
        'w-full px-4 py-3 border rounded-lg focus:outline-none transition-colors';

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setSuccessMessage('');
        if (!username) return;

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
            <h3 className="text-lg font-semibold text-cohi-text-dark">표시 이름 변경</h3>

            <div className="flex flex-col gap-1">
                <label htmlFor="displayName" className="text-sm text-cohi-text-dark">
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
                disabled={mutation.isPending || !username}
                className="w-full rounded-lg"
            >
                {mutation.isPending ? '변경 중...' : '변경하기'}
            </Button>
        </form>
    );
}
