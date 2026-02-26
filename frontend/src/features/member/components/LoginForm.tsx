import { useState, useCallback } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import Button from '~/components/button/Button';
import CoffeeCupIcon from '~/components/icons/CoffeeCupIcon';
import { useLogin } from '../hooks/useLogin';
import { useFormValidation, type ValidationRule } from '../hooks/useFormValidation';
import { getOAuthAuthorizationUrlApi } from '../api/oAuthApi';
import { getErrorMessage } from '~/libs/errorUtils';

interface LoginFormValues {
    username: string;
    password: string;
}

const validationRules: Record<keyof LoginFormValues, ValidationRule<string>> = {
    username: (value: string) => {
        if (!value.trim()) return '아이디를 입력해주세요.';
        return null;
    },
    password: (value: string) => {
        if (!value) return '비밀번호를 입력해주세요.';
        return null;
    },
};

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
    );
}

function KakaoIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M9 0C4.029 0 0 3.134 0 7c0 2.493 1.611 4.673 4.035 5.933L3.054 17.1c-.079.332.299.595.578.393L8.87 13.94c.043.002.086.003.13.003 4.971 0 9-3.134 9-7S13.971 0 9 0z" fill="#3C1E1E"/>
        </svg>
    );
}

export function LoginForm() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [oAuthPending, setOAuthPending] = useState<string | null>(null);
    const [oAuthError, setOAuthError] = useState<string | null>(null);
    const navigate = useNavigate();
    const loginMutation = useLogin();
    const { fields, handleBlur, validateAll, getInputClassName } =
        useFormValidation<LoginFormValues>(validationRules);

    const handleSocialLogin = async (provider: string) => {
        if (oAuthPending) return;
        setOAuthPending(provider);
        setOAuthError(null);
        try {
            const url = await getOAuthAuthorizationUrlApi(provider);
            window.location.href = url;
        } catch {
            setOAuthPending(null);
            setOAuthError('소셜 로그인 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
        }
    };

    const onBlur = useCallback(
        (name: keyof LoginFormValues, value: string) => {
            handleBlur(name, value);
        },
        [handleBlur]
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const values: LoginFormValues = { username: username.trim(), password };
        if (!validateAll(values)) {
            return;
        }
        loginMutation.mutate(
            { username: username.trim(), password },
            {
                onSuccess: () => navigate({ to: '/' }),
            }
        );
    };

    const isPending = loginMutation.isPending;
    const baseInputClass =
        'w-full px-4 py-3 border rounded-lg focus:outline-none transition-colors';

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[rgb(var(--cohe-bg-warm))]">
            {/* Logo */}
            <Link to='/' className="flex items-center gap-2 mb-8">
                <CoffeeCupIcon className="w-10 h-10 text-[var(--cohe-primary)]" />
                <span className="text-2xl font-bold text-[var(--cohe-text-dark)]">coheChat</span>
            </Link>

            {/* Login Card */}
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-center text-[var(--cohe-text-dark)] mb-6">로그인</h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="username" className="text-sm text-[var(--cohe-text-dark)]">아이디</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onBlur={() => onBlur('username', username)}
                            disabled={isPending}
                            required
                            placeholder="아이디"
                            className={getInputClassName('username', baseInputClass)}
                        />
                        {fields.username?.touched && fields.username.error && (
                            <span className="text-xs text-red-500 mt-1">{fields.username.error}</span>
                        )}
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="password" className="text-sm text-[var(--cohe-text-dark)]">비밀번호</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onBlur={() => onBlur('password', password)}
                            disabled={isPending}
                            required
                            placeholder="비밀번호"
                            className={getInputClassName('password', baseInputClass)}
                        />
                        {fields.password?.touched && fields.password.error && (
                            <span className="text-xs text-red-500 mt-1">{fields.password.error}</span>
                        )}
                    </div>

                    {loginMutation.isError && (
                        <div className="text-red-600 text-sm">
                            {getErrorMessage(loginMutation.error, '로그인에 실패했습니다.')}
                        </div>
                    )}

                    <Button
                        variant="primary"
                        size="lg"
                        type="submit"
                        disabled={isPending}
                        className="w-full rounded-lg mt-2"
                    >
                        {isPending ? '로그인 중...' : '로그인'}
                    </Button>
                </form>

                <div className="flex items-center gap-3 mt-4">
                    <hr className="flex-1 border-gray-200" />
                    <span className="text-xs text-gray-400">또는</span>
                    <hr className="flex-1 border-gray-200" />
                </div>

                <div className="flex flex-col gap-2 mt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleSocialLogin('google')}
                        disabled={!!oAuthPending || isPending}
                        className="w-full py-3 flex items-center justify-center gap-3 !bg-white !border-gray-300 !text-gray-700 hover:!bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <GoogleIcon />
                        <span className="text-sm font-medium">
                            {oAuthPending === 'google' ? '연결 중...' : 'Google로 로그인'}
                        </span>
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleSocialLogin('kakao')}
                        disabled={!!oAuthPending || isPending}
                        className="w-full py-3 flex items-center justify-center gap-3 !bg-[#FEE500] !border-0 hover:!bg-[#F0D800] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <KakaoIcon />
                        <span className="text-sm font-medium text-[#3C1E1E]">
                            {oAuthPending === 'kakao' ? '연결 중...' : '카카오로 로그인'}
                        </span>
                    </Button>
                    {oAuthError && (
                        <p className="text-xs text-red-500 text-center mt-1">{oAuthError}</p>
                    )}
                </div>

                <div className="text-center text-sm mt-6 text-[var(--cohe-text-dark)]">
                    계정이 없으신가요?{' '}
                    <Link to="/signup" className="text-[var(--cohe-primary)] font-semibold hover:underline">
                        회원가입
                    </Link>
                </div>
            </div>
        </div>
    );
}
