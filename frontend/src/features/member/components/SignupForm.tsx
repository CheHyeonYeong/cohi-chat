import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '~/components/button';
import { useSignup } from '../hooks/useSignup';

const REDIRECT_DELAY_MS = 1500;

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

        const usernamePattern = /^(?!hosts$)[a-zA-Z0-9._-]{4,12}$/i;
        if (!usernamePattern.test(username.trim())) {
            errors.push('아이디는 4~12자의 영문, 숫자, 특수문자(._-)만 가능하며, 예약어는 사용할 수 없습니다.');
        }

        const passwordPattern = /^[a-zA-Z0-9._-]{4,20}$/;
        if (!passwordPattern.test(password)) {
            errors.push('비밀번호는 4~20자의 영문, 숫자, 특수문자(._-)만 가능합니다.');
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
        <div className="space-y-4 px-8">
            <h2 className="text-2xl font-bold">회원가입</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <label htmlFor="username">아이디:</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={isPending}
                        required
                        minLength={4}
                        maxLength={12}
                        className="border px-3 py-2 rounded"
                    />
                    <p className="text-gray-500 text-xs">4~12자의 영문, 숫자, 특수문자(._-)만 가능</p>
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="email">이메일:</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isPending}
                        required
                        maxLength={128}
                        className="border px-3 py-2 rounded"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="displayName">표시 이름 (선택):</label>
                    <input
                        type="text"
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        disabled={isPending}
                        maxLength={20}
                        className="border px-3 py-2 rounded"
                    />
                    <p className="text-gray-500 text-xs">2~20자 (비워두면 자동 생성)</p>
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="password">비밀번호:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isPending}
                        required
                        minLength={4}
                        maxLength={20}
                        className="border px-3 py-2 rounded"
                    />
                    <p className="text-gray-500 text-xs">4~20자의 영문, 숫자, 특수문자(._-)만 가능</p>
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="passwordAgain">비밀번호 확인:</label>
                    <input
                        type="password"
                        id="passwordAgain"
                        value={passwordAgain}
                        onChange={(e) => setPasswordAgain(e.target.value)}
                        disabled={isPending}
                        required
                        minLength={4}
                        maxLength={20}
                        className="border px-3 py-2 rounded"
                    />
                </div>

                {validationErrors.length > 0 && (
                    <ul className="text-red-600 text-sm list-disc pl-5">
                        {validationErrors.map((error) => (
                            <li key={error}>{error}</li>
                        ))}
                    </ul>
                )}

                <Button
                    variant="primary"
                    type="submit"
                    disabled={isPending}
                    className="w-full py-3 px-5"
                >
                    {isPending ? '가입 중...' : '회원가입'}
                </Button>
            </form>

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

            <div className="text-center text-sm">
                이미 계정이 있으신가요?{' '}
                <Link to="/app/login" className="text-blue-600 hover:underline">
                    로그인
                </Link>
            </div>
        </div>
    );
}
