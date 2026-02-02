import { Link } from '@tanstack/react-router';
import { useSignupForm } from '../hooks/useSignupForm';
import { SignupForm } from './SignupForm';

export default function SignupPage() {
    const form = useSignupForm();

    return (
        <div className="space-y-4 px-8">
            <h2 className="text-2xl font-bold">회원가입</h2>

            <SignupForm
                username={form.username}
                setUsername={form.setUsername}
                email={form.email}
                setEmail={form.setEmail}
                displayName={form.displayName}
                setDisplayName={form.setDisplayName}
                password={form.password}
                setPassword={form.setPassword}
                passwordAgain={form.passwordAgain}
                setPasswordAgain={form.setPasswordAgain}
                passwordError={form.passwordError}
                onSubmit={form.handleSubmit}
                isPending={form.isPending}
                isError={form.isError}
                isSuccess={form.isSuccess}
            />

            <div className="text-center text-sm">
                이미 계정이 있으신가요?{' '}
                <Link to="/app/login" className="text-blue-600 hover:underline">
                    로그인
                </Link>
            </div>
        </div>
    );
}
