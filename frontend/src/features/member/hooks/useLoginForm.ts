import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useLogin } from './useLogin';

/**
 * 로그인 폼 상태 관리 훅입니다.
 *
 * 기능:
 * - username, password 상태 관리
 * - 로그인 성공 시 메인 페이지(/app)로 자동 리다이렉트
 *
 * @returns 폼 상태와 핸들러
 * - username, password: 입력값
 * - setUsername, setPassword: setter 함수
 * - handleSubmit: 폼 제출 핸들러
 * - isPending: 로그인 요청 진행 중 여부
 * - isError: 에러 발생 여부
 */
export function useLoginForm() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const loginMutation = useLogin();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        loginMutation.mutate(
            { username, password },
            {
                onSuccess: () => {
                    navigate({ to: '/app' });
                },
            }
        );
    };

    return {
        username,
        setUsername,
        password,
        setPassword,
        handleSubmit,
        isPending: loginMutation.isPending,
        isError: loginMutation.isError,
    };
}
