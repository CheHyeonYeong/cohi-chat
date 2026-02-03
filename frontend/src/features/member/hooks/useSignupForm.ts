import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useSignup } from './useSignup';

/** 회원가입 성공 후 로그인 페이지로 이동하기까지 대기 시간 (ms) */
const REDIRECT_DELAY_MS = 1500;

/**
 * 회원가입 폼 상태 관리 훅입니다.
 *
 * 기능:
 * - username, email, displayName, password, passwordAgain 상태 관리
 * - 비밀번호 일치 검증
 * - 회원가입 성공 시 로그인 페이지로 자동 리다이렉트
 *
 * @returns 폼 상태와 핸들러
 * - username, email, displayName, password, passwordAgain: 입력값
 * - setUsername, setEmail 등: setter 함수
 * - passwordError: 비밀번호 검증 에러 메시지
 * - handleSubmit: 폼 제출 핸들러
 * - isPending, isError, isSuccess: mutation 상태
 */
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
                    }, REDIRECT_DELAY_MS);
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
