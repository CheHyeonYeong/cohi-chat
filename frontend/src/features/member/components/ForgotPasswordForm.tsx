import { useState } from 'react';
import { AuthPageLayout } from './AuthPageLayout';
import { ForgotPasswordEmailForm } from './ForgotPasswordEmailForm';
import { ForgotPasswordSuccess } from './ForgotPasswordSuccess';

export function ForgotPasswordForm() {
    const [submitted, setSubmitted] = useState(false);

    return (
        <AuthPageLayout title="비밀번호 찾기">
            {submitted
                ? <ForgotPasswordSuccess />
                : <ForgotPasswordEmailForm onSuccess={() => setSubmitted(true)} />}
        </AuthPageLayout>
    );
}
