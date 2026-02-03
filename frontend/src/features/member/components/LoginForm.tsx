import { Button } from '~/components/button';

interface LoginFormProps {
    username: string;
    setUsername: (value: string) => void;
    password: string;
    setPassword: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    isPending: boolean;
    isError: boolean;
}

export function LoginForm({
    username,
    setUsername,
    password,
    setPassword,
    onSubmit,
    isPending,
    isError,
}: LoginFormProps) {
    return (
        <>
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
            {isError && (
                <div className="error-message">
                    로그인에 실패했습니다. 다시 시도해주세요.
                </div>
            )}
        </>
    );
}
