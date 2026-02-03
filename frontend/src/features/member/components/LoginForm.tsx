import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '~/components/button';
import { useLogin } from '../hooks/useLogin';

/**
 * 로그인 폼 컴포넌트입니다.
 * 로그인 성공 시 메인 페이지로 리다이렉트됩니다.
 */
export function LoginForm() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const loginMutation = useLogin();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        loginMutation.mutate(
            { username: username.trim(), password },
            {
                onSuccess: () => navigate({ to: '/app' }),
            }
        );
    };

    const isPending = loginMutation.isPending;

    return (
        <div className="space-y-4 px-8">
            <h2 className="text-2xl font-bold">로그인</h2>

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
                    />
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
                    />
                </div>
                <Button
                    variant="primary"
                    type="submit"
                    disabled={isPending}
                    className="w-full py-3 px-5"
                >
                    {isPending ? '로그인 중...' : '로그인'}
                </Button>
            </form>

            {loginMutation.isError && (
                <div className="error-message">
                    로그인에 실패했습니다. 다시 시도해주세요.
                </div>
            )}

            <div className="text-center text-sm">
                계정이 없으신가요?{' '}
                <Link to="/app/signup" className="text-blue-600 hover:underline">
                    회원가입
                </Link>
            </div>
        </div>
    );
}
