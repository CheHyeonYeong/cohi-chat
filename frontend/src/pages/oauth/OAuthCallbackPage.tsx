import { useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { useOAuthLogin } from '~/features/member';

export default function OAuthCallbackPage() {
    const navigate = useNavigate();
    const { provider } = useParams({ strict: false });
    const { code, error, state } = useSearch({ strict: false }) as { code?: string; error?: string; state?: string };
    const hasInitiated = useRef(false);
    const loginMutation = useOAuthLogin();

    useEffect(() => {
        if (hasInitiated.current) return;
        hasInitiated.current = true;

        if (error || !code || !provider || !state) {
            navigate({ to: '/app/login' });
            return;
        }

        loginMutation.mutateAsync({ provider, code, state })
            .then(() => navigate({ to: '/app' }))
            .catch(() => navigate({ to: '/app/login' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [code, error, provider, state]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--cohe-bg-warm)]">
            {loginMutation.isError ? (
                <p className="text-red-500 text-sm">로그인에 실패했습니다. 다시 시도해주세요.</p>
            ) : (
                <p className="text-[var(--cohe-text-dark)]">로그인 처리 중...</p>
            )}
        </div>
    );
}
