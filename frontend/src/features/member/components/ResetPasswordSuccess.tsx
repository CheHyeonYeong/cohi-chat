import { Link } from '@tanstack/react-router';

export const ResetPasswordSuccess = () => <div data-testid="reset-password-success">
    <p className="text-sm text-center text-cohi-text-dark mb-6">
                비밀번호가 성공적으로 변경되었습니다.
                새 비밀번호로 로그인해주세요.
    </p>
    <Link
        to="/login"
        className="block text-center text-cohi-primary font-semibold hover:underline"
    >
                로그인으로 이동
    </Link>
</div>;
