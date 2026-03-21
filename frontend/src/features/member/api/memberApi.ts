import { httpClient } from '~/libs/httpClient';
import type {
    LoginRequest,
    LoginResponse,
    LoginCredentials,
    SignupPayload,
    SignupResponse,
    MemberResponseDTO,
    HostResponseDTO,
    UpdateProfilePayload,
    UpdateMemberPayload,
    ProfileImageUploadRequest,
    ProfileImageUploadResponse,
    ProfileImageConfirmRequest,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const MEMBER_API = `${API_BASE}/members/v1`;

export async function loginApi(credentials: LoginCredentials): Promise<LoginResponse> {
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
}

export async function signupApi(payload: SignupPayload): Promise<SignupResponse> {
    const response = await httpClient<SignupResponse>(`${MEMBER_API}/signup`, {
        method: 'POST',
        body: payload,
    });

    if (!response) {
        throw new Error('회원가입에 실패했습니다.');
    }

    return response;
}

export async function logoutApi(): Promise<void> {
    await httpClient<void>(`${MEMBER_API}/logout`, {
        method: 'DELETE',
    });
}

export async function refreshTokenApi(): Promise<void> {
    await httpClient<void>(`${MEMBER_API}/refresh`, {
        method: 'POST',
    });
}

export async function getUserApi(username: string): Promise<MemberResponseDTO> {
    return httpClient<MemberResponseDTO>(
        `${MEMBER_API}/${encodeURIComponent(username)}`
    );
}

export async function updateProfileApi(payload: UpdateProfilePayload): Promise<HostResponseDTO> {
    const response = await httpClient<HostResponseDTO>(`${MEMBER_API}/me/profile`, {
        method: 'PATCH',
        body: payload,
    });
    if (!response) {
        throw new Error('프로필 업데이트에 실패했습니다.');
    }
    return response;
}

export async function updateMemberApi(username: string, payload: UpdateMemberPayload): Promise<MemberResponseDTO> {
    const response = await httpClient<MemberResponseDTO>(`${MEMBER_API}/${encodeURIComponent(username)}`, {
        method: 'PATCH',
        body: payload,
    });
    if (!response) {
        throw new Error('회원 정보 수정에 실패했습니다.');
    }
    return response;
}

export async function getProfileImagePresignedUrlApi(
    request: ProfileImageUploadRequest
): Promise<ProfileImageUploadResponse> {
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
}

export async function confirmProfileImageUploadApi(
    request: ProfileImageConfirmRequest
): Promise<string> {
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
}

export async function deleteProfileImageApi(): Promise<void> {
    await httpClient<void>(`${MEMBER_API}/me/profile-image`, {
        method: 'DELETE',
    });
}
