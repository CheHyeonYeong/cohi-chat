import { useFormValidation } from './useFormValidation';
import { validatePassword, validatePasswordConfirm } from '../utils/validators';

export interface PasswordFormValues {
    newPassword: string;
    confirmPassword: string;
}

export const usePasswordValidation = (getNewPassword: () => string) => {
    const validationRules = {
        newPassword: validatePassword('새 비밀번호를 입력해주세요.'),
        confirmPassword: validatePasswordConfirm(getNewPassword),
    };

    return useFormValidation<PasswordFormValues>(validationRules);
};
