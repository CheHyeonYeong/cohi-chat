import { Button } from '~/components/button';

export function ResetPasswordVerificationError() {
    return (
        <div data-testid="reset-password-verification-error">
            <p className="text-sm text-center text-red-600 mb-6">
                일시적인 오류가 발생했습니다.<br/>
                다시 시도해주세요.
            </p>
            <Button
                type="button"
                variant="primary"
                className="w-full"
                onClick={() => window.location.reload()}
            >
                다시 시도
            </Button>
        </div>
    );
}
