import { useState, useEffect, useRef } from 'react';
import { useSearch } from '@tanstack/react-router';
import { useVerifyResetToken } from '../hooks/usePasswordReset';
import { AuthPageLayout } from './AuthPageLayout';
import { ResetPasswordVerifying } from './ResetPasswordVerifying';
import { ResetPasswordInvalidToken } from './ResetPasswordInvalidToken';
import { ResetPasswordSuccess } from './ResetPasswordSuccess';
import { ResetPasswordFields } from './ResetPasswordFields';

export function ResetPasswordForm() {
    const { token } = useSearch({ from: '/reset-password' });
    const [resetSuccess, setResetSuccess] = useState(false);
    const verifyMutation = useVerifyResetToken();

    const verifiedTokenRef = useRef<string | null>(null);
    useEffect(() => {
        if (token && verifiedTokenRef.current !== token) {
            verifiedTokenRef.current = token;
            verifyMutation.mutate(token);
        }
    }, [token, verifyMutation]);

    const isTokenValid = verifyMutation.isSuccess && verifyMutation.data?.valid;
    const isTokenInvalid =
        !token || verifyMutation.isError || (verifyMutation.isSuccess && !verifyMutation.data?.valid);
    const isVerifying = verifyMutation.isPending;

    return (
        <AuthPageLayout title="비밀번호 재설정">
            {isVerifying && <ResetPasswordVerifying />}
            {isTokenInvalid && !isVerifying && <ResetPasswordInvalidToken />}
            {resetSuccess && <ResetPasswordSuccess />}
            {isTokenValid && !resetSuccess && (
                <ResetPasswordFields token={token!} onSuccess={() => setResetSuccess(true)} />
            )}
        </AuthPageLayout>
    );
}
