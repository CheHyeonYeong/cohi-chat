import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useSignup } from './useSignup';

/** 회원가입 성공 후 로그인 페이지로 이동하기까지 대기 시간 (ms) */
const REDIRECT_DELAY_MS = 1500;

export function useSignupForm() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [passwordAgain, setPasswordAgain] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const navigate = useNavigate();
    const signupMutation = useSignup();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== passwordAgain) {
            setPasswordError('비밀번호가 일치하지 않습니다.');
            return;
        }
        setPasswordError('');

        signupMutation.mutate(
            {
                username,
                email,
                displayName: displayName || undefined,
                password,
            },
            {
                onSuccess: () => {
                    setTimeout(() => {
                        navigate({ to: '/app/login' });
                    }, 1500);
                },
            }
        );
    };

    return {
        username,
        setUsername,
        email,
        setEmail,
        displayName,
        setDisplayName,
        password,
        setPassword,
        passwordAgain,
        setPasswordAgain,
        passwordError,
        handleSubmit,
        isPending: signupMutation.isPending,
        isError: signupMutation.isError,
        isSuccess: signupMutation.isSuccess,
    };
}
