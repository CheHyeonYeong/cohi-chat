import { PASSWORD_PATTERN, USERNAME_PATTERN, EMAIL_PATTERN } from './constants';
import type { ValidationRule } from '../hooks/useFormValidation';

export const validateUsername: ValidationRule<string> = (value: string) => {
    if (!value.trim()) return '아이디를 입력해주세요.';
    if (!USERNAME_PATTERN.test(value.trim())) {
        return '아이디는 4~12자의 영문, 숫자, 특수문자(._-)만 가능합니다.';
    }
    return null;
};

export const validateEmail: ValidationRule<string> = (value: string) => {
    if (!value.trim()) return '이메일을 입력해주세요.';
    if (!EMAIL_PATTERN.test(value.trim())) {
        return '올바른 이메일 형식이 아닙니다.';
    }
    return null;
};

export const validateDisplayName: ValidationRule<string> = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return '표시 이름을 입력해주세요.';
    if (trimmed.length < 2 || trimmed.length > 20) {
        return '표시 이름은 2~20자여야 합니다.';
    }
    return null;
};

export const validatePassword = (emptyMessage = '비밀번호를 입력해주세요.'): ValidationRule<string> => (value: string) => {
    if (!value) return emptyMessage;
    if (!PASSWORD_PATTERN.test(value)) {
        return '비밀번호는 8~20자의 영문, 숫자, 특수문자(!@#$%^&*._-)만 가능합니다.';
    }
    return null;
};

export const validatePasswordConfirm = (getPassword: () => string): ValidationRule<string> => (value: string) => {
    if (!value) return '비밀번호 확인을 입력해주세요.';
    if (value !== getPassword()) {
        return '비밀번호가 일치하지 않습니다.';
    }
    return null;
};
