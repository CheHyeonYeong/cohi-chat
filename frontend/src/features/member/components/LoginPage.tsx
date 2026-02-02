import { Link } from '@tanstack/react-router';
import { useLoginForm } from '../hooks/useLoginForm';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
    const form = useLoginForm();

    return (
        <div className="space-y-4 px-8">
            <h2 className="text-2xl font-bold">로그인</h2>

            <LoginForm
                username={form.username}
                setUsername={form.setUsername}
                password={form.password}
                setPassword={form.setPassword}
                onSubmit={form.handleSubmit}
                isPending={form.isPending}
                isError={form.isError}
            />

            <div className="text-center text-sm">
                계정이 없으신가요?{' '}
                <Link to="/app/signup" className="text-blue-600 hover:underline">
                    회원가입
                </Link>
            </div>
        </div>
    );
}
