import { useState, useCallback } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useLogin } from '../hooks/useLogin';
import { useFormValidation, type ValidationRule } from '../hooks/useFormValidation';

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

function CoffeeCupIcon({ className = '' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 21V19H20V21H2ZM4 18C3.45 18 2.979 17.804 2.587 17.412C2.195 17.02 1.99933 16.5493 2 16V5H18V9H20C20.55 9 21.021 9.196 21.413 9.588C21.805 9.98 22.0007 10.4507 22 11V14C22 14.55 21.804 15.021 21.412 15.413C21.02 15.805 20.5493 16.0007 20 16H18V18H4ZM18 14H20V11H18V14ZM4 16H16V7H4V16Z"/>
            <path d="M7 4C7 3.5 7.5 2 9 2C10.5 2 11 3.5 11 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
    );
}

export function LoginForm() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const loginMutation = useLogin();
    const { fields, handleBlur, validateAll, getInputClassName } =
        useFormValidation<LoginFormValues>(validationRules);

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
                onSuccess: () => navigate({ to: '/app' }),
            }
        );
    };

    const isPending = loginMutation.isPending;
    const baseInputClass =
        'w-full px-4 py-3 border rounded-lg focus:outline-none transition-colors';

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--cohe-bg-warm)]">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-8">
                <CoffeeCupIcon className="w-10 h-10 text-[var(--cohe-primary)]" />
                <span className="text-2xl font-bold text-[var(--cohe-text-dark)]">coheChat</span>
            </div>

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
                            {loginMutation.error?.message || '로그인에 실패했습니다. 다시 시도해주세요.'}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full py-3 bg-[var(--cohe-primary)] text-white font-semibold rounded-lg hover:bg-[var(--cohe-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {isPending ? '로그인 중...' : '로그인'}
                    </button>
                </form>

                <div className="text-center text-sm mt-6 text-[var(--cohe-text-dark)]">
                    계정이 없으신가요?{' '}
                    <Link to="/app/signup" className="text-[var(--cohe-primary)] font-semibold hover:underline">
                        회원가입
                    </Link>
                </div>
            </div>
        </div>
    );
}
