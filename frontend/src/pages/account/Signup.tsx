import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '~/components/button';
import { useSignup } from '~/hooks/useSignup';

export default function Signup() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [passwordAgain, setPasswordAgain] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const signupMutation = useSignup();

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (password !== passwordAgain) {
            setPasswordError('비밀번호가 일치하지 않습니다.');
            return;
        }
        setPasswordError('');

        signupMutation.mutate({
            username,
            email,
            displayName: displayName || undefined,
            password,
        });
    };

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
                        required
                        minLength={4}
                        maxLength={40}
                        className="border px-3 py-2 rounded"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="email">이메일:</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                        minLength={4}
                        maxLength={40}
                        className="border px-3 py-2 rounded"
                        placeholder="비워두면 자동 생성됩니다"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="password">비밀번호:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        maxLength={128}
                        className="border px-3 py-2 rounded"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="passwordAgain">비밀번호 확인:</label>
                    <input
                        type="password"
                        id="passwordAgain"
                        value={passwordAgain}
                        onChange={(e) => setPasswordAgain(e.target.value)}
                        required
                        minLength={8}
                        maxLength={128}
                        className="border px-3 py-2 rounded"
                    />
                </div>

                {passwordError && (
                    <div className="text-red-600 text-sm">
                        {passwordError}
                    </div>
                )}

                <Button
                    variant='primary'
                    type="submit"
                    disabled={signupMutation.isPending}
                    className="w-full py-3 px-5"
                >
                    {signupMutation.isPending ? '가입 중...' : '회원가입'}
                </Button>
            </form>

            {signupMutation.isError && (
                <div className="text-red-600 text-sm">
                    회원가입에 실패했습니다. 다시 시도해주세요.
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
