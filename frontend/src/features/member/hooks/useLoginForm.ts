import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useLogin } from './useLogin';

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
