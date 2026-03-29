import { httpClient } from '~/libs/httpClient';
import type {
    LoginRequest,
    LoginResponse,
    LoginCredentials,
    SignupPayload,
    SignupResponse,
    MemberResponseDTO,
    UpdateMemberPayload,
    ProfileImageUploadRequest,
    ProfileImageUploadResponse,
    ProfileImageConfirmRequest,
} from '../types';
import type { HostResponseDTO, UpdateProfilePayload } from '~/features/host';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const MEMBER_API = `${API_BASE}/members/v1`;

export const loginApi = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const request: LoginRequest = {
        ...credentials,
        provider: 'LOCAL',
    };

    const response = await httpClient<LoginResponse>(`${MEMBER_API}/login`, {
        method: 'POST',
        body: request,
        skipAuthRefresh: true, // 로그인 요청은 401 시 refresh 재시도 불필요
    });

    if (!response) {
        throw new Error('로그인 응답을 받지 못했습니다.');
    }
    if (!response.username || !response.displayName) {
        throw new Error('로그인 응답이 올바르지 않습니다.');
    }

    return response;
};

export const signupApi = async (payload: SignupPayload): Promise<SignupResponse> => {
    const response = await httpClient<SignupResponse>(`${MEMBER_API}/signup`, {
        method: 'POST',
        body: payload,
    });

    if (!response) {
        throw new Error('회원가입에 실패했습니다.');
    }

    return response;
};

export const logoutApi = async (): Promise<void> => {
    await httpClient<void>(`${MEMBER_API}/logout`, {
        method: 'DELETE',
    });
};

export const refreshTokenApi = async (): Promise<void> => {
    await httpClient<void>(`${MEMBER_API}/refresh`, {
        method: 'POST',
    });
};

export const getUserApi = async (username: string): Promise<MemberResponseDTO> => httpClient<MemberResponseDTO>(
    `${MEMBER_API}/${encodeURIComponent(username)}`
);

export const updateProfileApi = async (payload: UpdateProfilePayload): Promise<HostResponseDTO> => {
    const response = await httpClient<HostResponseDTO>(`${MEMBER_API}/me/profile`, {
        method: 'PATCH',
        body: payload,
    });
    if (!response) {
        throw new Error('프로필 업데이트에 실패했습니다.');
    }
    return response;
};

export const updateMemberApi = async (username: string, payload: UpdateMemberPayload): Promise<MemberResponseDTO> => {
    const response = await httpClient<MemberResponseDTO>(`${MEMBER_API}/${encodeURIComponent(username)}`, {
        method: 'PATCH',
        body: payload,
    });
    if (!response) {
        throw new Error('회원 정보 수정에 실패했습니다.');
    }
    return response;
};

export const getProfileImagePresignedUrlApi = async (
    request: ProfileImageUploadRequest
): Promise<ProfileImageUploadResponse> => {
    const response = await httpClient<ProfileImageUploadResponse>(
        `${MEMBER_API}/me/profile-image/presigned-url`,
        {
            method: 'POST',
            body: request,
        }
    );
    if (!response) {
        throw new Error('프로필 이미지 업로드 URL 생성에 실패했습니다.');
    }
    return response;
};

export const confirmProfileImageUploadApi = async (
    request: ProfileImageConfirmRequest
): Promise<string> => {
    const response = await httpClient<string>(
        `${MEMBER_API}/me/profile-image/confirm`,
        {
            method: 'POST',
            body: request,
        }
    );
    if (!response) {
        throw new Error('프로필 이미지 업로드 확인에 실패했습니다.');
    }
    return response;
};

export const deleteProfileImageApi = async (): Promise<void> => {
    await httpClient<void>(`${MEMBER_API}/me/profile-image`, {
        method: 'DELETE',
    });
};
