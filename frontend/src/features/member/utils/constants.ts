export const PASSWORD_PATTERN = /^[a-zA-Z0-9!@#$%^&*._-]{8,20}$/;
// BE @Pattern과 동일한 검증 규칙
export const USERNAME_PATTERN = /^(?!hosts$)[a-zA-Z0-9._-]{4,12}$/i;
// RFC 5322 기반 간소화 정규식: 로컬파트@도메인.TLD(2자이상)
export const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
