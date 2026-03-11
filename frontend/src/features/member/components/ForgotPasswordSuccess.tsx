import { Link } from '@tanstack/react-router';

export function ForgotPasswordSuccess() {
    return (
        <div data-testid="forgot-password-success">
            <p className="text-sm text-center text-[var(--cohi-text-dark)] mb-6">
                입력하신 이메일로 비밀번호 재설정 링크를 발송했습니다.
                이메일을 확인해주세요.
            </p>
            <Link
                to="/login"
                className="block text-center text-[var(--cohi-primary)] font-semibold hover:underline"
            >
                로그인으로 돌아가기
            </Link>
        </div>
    );
}
