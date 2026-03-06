import { useState } from 'react';
import { useSearch } from '@tanstack/react-router';
import { useVerifyResetToken } from '~/features/member';
import { AuthPageLayout } from './AuthPageLayout';
import { ResetPasswordVerifying } from './ResetPasswordVerifying';
import { ResetPasswordInvalidToken } from './ResetPasswordInvalidToken';
import { ResetPasswordSuccess } from './ResetPasswordSuccess';
import { ResetPasswordFields } from './ResetPasswordFields';

export function ResetPasswordForm() {
    const { token } = useSearch({ from: '/reset-password' });
    const [resetSuccess, setResetSuccess] = useState(false);
    const { isLoading, isTokenValid, isTokenInvalid } = useVerifyResetToken(token);

    return (
        <AuthPageLayout title="비밀번호 재설정">
            {isLoading && <ResetPasswordVerifying />}
            {isTokenInvalid && !isLoading && <ResetPasswordInvalidToken />}
            {resetSuccess && <ResetPasswordSuccess />}
            {isTokenValid && !resetSuccess && (
                <ResetPasswordFields token={token!} onSuccess={() => setResetSuccess(true)} />
            )}
        </AuthPageLayout>
    );
}
