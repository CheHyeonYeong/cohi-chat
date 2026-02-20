import { useState, useCallback } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import Button from '~/components/button/Button';
import { useSignup } from '../hooks/useSignup';
import { useFormValidation, type ValidationRule } from '../hooks/useFormValidation';

// BE @Pattern과 동일한 검증 규칙
const USERNAME_PATTERN = /^(?!hosts$)[a-zA-Z0-9._-]{4,12}$/i;
const PASSWORD_PATTERN = /^[a-zA-Z0-9!@#$%^&*._-]{8,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SignupFormValues {
    username: string;
    email: string;
    displayName: string;
    password: string;
    passwordAgain: string;
}

// passwordAgain validation에서 password 값 참조를 위한 클로저
const createValidationRules = (
    getPassword: () => string
): Record<keyof SignupFormValues, ValidationRule<string>> => ({
    username: (value: string) => {
        if (!value.trim()) return '아이디를 입력해주세요.';
        if (!USERNAME_PATTERN.test(value.trim())) {
            return '아이디는 4~12자의 영문, 숫자, 특수문자(._-)만 가능합니다.';
        }
        return null;
    },
    email: (value: string) => {
        if (!value.trim()) return '이메일을 입력해주세요.';
        if (!EMAIL_PATTERN.test(value.trim())) {
            return '올바른 이메일 형식이 아닙니다.';
        }
        return null;
    },
    displayName: (value: string) => {
        const trimmed = value.trim();
        if (trimmed && (trimmed.length < 2 || trimmed.length > 20)) {
            return '표시 이름은 2~20자여야 합니다.';
        }
        return null;
    },
    password: (value: string) => {
        if (!value) return '비밀번호를 입력해주세요.';
        if (!PASSWORD_PATTERN.test(value)) {
            return '비밀번호는 8~20자의 영문, 숫자, 특수문자(!@#$%^&*._-)만 가능합니다.';
        }
        return null;
    },
    passwordAgain: (value: string) => {
        if (!value) return '비밀번호 확인을 입력해주세요.';
        if (value !== getPassword()) {
            return '비밀번호가 일치하지 않습니다.';
        }
        return null;
    },
});

export function SignupForm() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [passwordAgain, setPasswordAgain] = useState('');
    const navigate = useNavigate();
    const signupMutation = useSignup();

    const validationRules = createValidationRules(() => password);
    const { fields, handleBlur, validateAll, getInputClassName } =
        useFormValidation<SignupFormValues>(validationRules);

    const onBlur = useCallback(
        (name: keyof SignupFormValues, value: string) => {
            handleBlur(name, value);
        },
        [handleBlur]
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const values: SignupFormValues = {
            username: username.trim(),
            email: email.trim(),
            displayName: displayName.trim(),
            password,
            passwordAgain,
        };

        if (!validateAll(values)) {
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
                    navigate({ to: '/app/login' });
                },
            }
        );
    };

    const isPending = signupMutation.isPending;
    const baseInputClass =
        'w-full px-4 py-3 border rounded-lg focus:outline-none transition-colors';

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
                            onBlur={() => onBlur('username', username)}
                            disabled={isPending}
                            required
                            minLength={4}
                            maxLength={12}
                            placeholder="(4-12자)"
                            className={getInputClassName('username', baseInputClass)}
                        />
                        {fields.username?.touched && fields.username.error && (
                            <span className="text-xs text-red-500 mt-1">{fields.username.error}</span>
                        )}
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
                            onBlur={() => onBlur('email', email)}
                            disabled={isPending}
                            required
                            maxLength={128}
                            placeholder="(최대 128자)"
                            className={getInputClassName('email', baseInputClass)}
                        />
                        {fields.email?.touched && fields.email.error && (
                            <span className="text-xs text-red-500 mt-1">{fields.email.error}</span>
                        )}
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
                            onBlur={() => onBlur('displayName', displayName)}
                            disabled={isPending}
                            maxLength={20}
                            placeholder="(2-20자)"
                            className={getInputClassName('displayName', baseInputClass)}
                        />
                        {fields.displayName?.touched && fields.displayName.error && (
                            <span className="text-xs text-red-500 mt-1">{fields.displayName.error}</span>
                        )}
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
                            onBlur={() => onBlur('password', password)}
                            disabled={isPending}
                            required
                            minLength={8}
                            maxLength={20}
                            placeholder="(8-20자)"
                            className={getInputClassName('password', baseInputClass)}
                        />
                        {fields.password?.touched && fields.password.error && (
                            <span className="text-xs text-red-500 mt-1">{fields.password.error}</span>
                        )}
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
                            onBlur={() => onBlur('passwordAgain', passwordAgain)}
                            disabled={isPending}
                            required
                            minLength={8}
                            maxLength={20}
                            placeholder="비밀번호 확인"
                            className={getInputClassName('passwordAgain', baseInputClass)}
                        />
                        {fields.passwordAgain?.touched && fields.passwordAgain.error && (
                            <span className="text-xs text-red-500 mt-1">{fields.passwordAgain.error}</span>
                        )}
                    </div>

                    {signupMutation.isError && (
                        <div className="text-red-600 text-sm">
                            {signupMutation.error?.message || '회원가입에 실패했습니다. 다시 시도해주세요.'}
                        </div>
                    )}

                    <Button
                        variant="primary"
                        size="lg"
                        type="submit"
                        disabled={isPending}
                        className="w-full rounded-lg mt-2"
                    >
                        {isPending ? '가입 중...' : '회원가입'}
                    </Button>
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
