import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useSignup } from '../hooks/useSignup';

const REDIRECT_DELAY_MS = 1500;

// BE @Pattern과 동일한 검증 규칙
const USERNAME_PATTERN = /^(?!hosts$)[a-zA-Z0-9._-]{4,12}$/i;
const PASSWORD_PATTERN = /^[a-zA-Z0-9!@#$%^&*._-]{8,20}$/;

export function SignupForm() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [passwordAgain, setPasswordAgain] = useState('');
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const navigate = useNavigate();
    const signupMutation = useSignup();
    const redirectTimerRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        return () => {
            if (redirectTimerRef.current) {
                clearTimeout(redirectTimerRef.current);
            }
        };
    }, []);

    const validate = (): boolean => {
        const errors: string[] = [];

        if (!USERNAME_PATTERN.test(username.trim())) {
            errors.push('아이디는 4~12자의 영문, 숫자, 특수문자(._-)만 가능하며, 예약어는 사용할 수 없습니다.');
        }

        if (!PASSWORD_PATTERN.test(password)) {
            errors.push('비밀번호는 8~20자의 영문, 숫자, 특수문자(!@#$%^&*._-)만 가능합니다.');
        }

        if (password !== passwordAgain) {
            errors.push('비밀번호가 일치하지 않습니다.');
        }

        const trimmedDisplayName = displayName.trim();
        if (trimmedDisplayName && (trimmedDisplayName.length < 2 || trimmedDisplayName.length > 20)) {
            errors.push('표시 이름은 2~20자여야 합니다.');
        }

        setValidationErrors(errors);
        return errors.length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        signupMutation.mutate(
            {
                username: username.trim(),
                email: email.trim(),
                displayName: displayName.trim() || undefined,
                password,
            },
            {
                onSuccess: () => {
                    redirectTimerRef.current = setTimeout(() => {
                        navigate({ to: '/app/login' });
                    }, REDIRECT_DELAY_MS);
                },
            }
        );
    };

    const isPending = signupMutation.isPending;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--cohe-bg-warm)] py-8">
            {/* Signup Card */}
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-center text-[var(--cohe-text-dark)] mb-6">회원가입</h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="username" className="text-sm text-[var(--cohe-text-dark)]">
                            아이디 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isPending}
                            required
                            minLength={4}
                            maxLength={12}
                            placeholder="(4-12자)"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[var(--cohe-primary)] transition-colors"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="email" className="text-sm text-[var(--cohe-text-dark)]">
                            이메일 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isPending}
                            required
                            maxLength={128}
                            placeholder="(최대 128자)"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[var(--cohe-primary)] transition-colors"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="displayName" className="text-sm text-[var(--cohe-text-dark)]">
                            표시 이름 (선택)
                        </label>
                        <input
                            type="text"
                            id="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            disabled={isPending}
                            maxLength={20}
                            placeholder="(2-20자)"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[var(--cohe-primary)] transition-colors"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="password" className="text-sm text-[var(--cohe-text-dark)]">
                            비밀번호 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isPending}
                            required
                            minLength={8}
                            maxLength={20}
                            placeholder="(8-20자)"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[var(--cohe-primary)] transition-colors"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="passwordAgain" className="text-sm text-[var(--cohe-text-dark)]">
                            비밀번호 확인 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="password"
                            id="passwordAgain"
                            value={passwordAgain}
                            onChange={(e) => setPasswordAgain(e.target.value)}
                            disabled={isPending}
                            required
                            minLength={8}
                            maxLength={20}
                            placeholder="비밀번호"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[var(--cohe-primary)] transition-colors"
                        />
                    </div>

                    {validationErrors.length > 0 && (
                        <ul className="text-red-600 text-sm list-disc pl-5">
                            {validationErrors.map((error) => (
                                <li key={error}>{error}</li>
                            ))}
                        </ul>
                    )}

                    {signupMutation.isError && (
                        <div className="text-red-600 text-sm">
                            {signupMutation.error?.message || '회원가입에 실패했습니다. 다시 시도해주세요.'}
                        </div>
                    )}

                    {signupMutation.isSuccess && (
                        <div className="text-green-600 text-sm">
                            회원가입 성공! 로그인 페이지로 이동합니다...
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full py-3 bg-[var(--cohe-primary)] text-white font-semibold rounded-lg hover:bg-[var(--cohe-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {isPending ? '가입 중...' : '회원가입'}
                    </button>
                </form>

                <div className="text-center text-sm mt-6 text-[var(--cohe-text-dark)]">
                    이미 계정이 있으신가요?{' '}
                    <Link to="/app/login" className="text-[var(--cohe-primary)] font-semibold hover:underline">
                        로그인
                    </Link>
                </div>
            </div>
        </div>
    );
}
