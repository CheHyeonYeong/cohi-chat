import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';

export const ResetPasswordVerifying = () => {
    const [isTimeout, setIsTimeout] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsTimeout(true), 5000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div data-testid="reset-password-verifying" className="text-center">
            <p className="text-sm text-gray-500">
                토큰을 확인하고 있습니다...
            </p>
            {isTimeout && (
                <div className="mt-4">
                    <p className="text-sm text-red-600 mb-4">
                        서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.
                    </p>
                    <Link
                        to="/forgot-password"
                        className="text-cohi-primary font-semibold hover:underline text-sm"
                    >
                        비밀번호 찾기로 이동
                    </Link>
                </div>
            )}
        </div>
    );
};
