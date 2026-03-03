import { useFormValidation, type ValidationRule } from './useFormValidation';

const PASSWORD_PATTERN = /^[a-zA-Z0-9!@#$%^&*._-]{8,20}$/;

export interface PasswordFormValues {
    newPassword: string;
    confirmPassword: string;
}

export function usePasswordValidation(getNewPassword: () => string) {
    const validationRules: Record<keyof PasswordFormValues, ValidationRule<string>> = {
        newPassword: (value: string) => {
            if (!value) return '새 비밀번호를 입력해주세요.';
            if (!PASSWORD_PATTERN.test(value)) {
                return '비밀번호는 8~20자의 영문, 숫자, 특수문자(!@#$%^&*._-)만 가능합니다.';
            }
            return null;
        },
        confirmPassword: (value: string) => {
            if (!value) return '비밀번호 확인을 입력해주세요.';
            if (value !== getNewPassword()) {
                return '비밀번호가 일치하지 않습니다.';
            }
            return null;
        },
    };

    return useFormValidation<PasswordFormValues>(validationRules);
}
