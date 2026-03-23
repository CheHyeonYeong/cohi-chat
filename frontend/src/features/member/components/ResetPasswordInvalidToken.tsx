import { Link } from '@tanstack/react-router';

export function ResetPasswordInvalidToken() {
    return (
        <div data-testid="reset-password-invalid-token">
            <p className="text-sm text-center text-red-600 mb-6">
                유효하지 않거나 만료된 링크입니다.<br/>
                비밀번호 재설정을 다시 요청해주세요.
            </p>
            <Link
                to="/forgot-password"
                className="block text-center text-cohi-primary font-semibold hover:underline"
            >
                비밀번호 찾기로 이동
            </Link>
        </div>
    );
}
