export type Role = 'GUEST' | 'HOST' | 'ADMIN';

export interface MemberResponseDTO {
    id: string;
    username: string;
    displayName: string;
    email: string;
    role: Role;
    profileImageUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface IUserSimple {
    username: string;
    displayName: string;
    role: Role;
}

export interface AuthUser extends MemberResponseDTO {
    isHost: boolean;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export type AuthProvider = 'LOCAL' | 'GOOGLE';

export interface LoginRequest extends LoginCredentials {
    provider: AuthProvider;
}

export interface LoginResponse {
    username: string;
    displayName: string;
    expiredInMinutes: number;
}

export interface SignupPayload {
    username: string;
    email: string;
    displayName?: string;
    password: string;
}

export interface SignupResponse {
    id: string;
    username: string;
    displayName: string;
}

export interface UpdateMemberPayload {
    displayName?: string;
    password?: string;
}

export interface ProfileImageUploadRequest {
    fileName: string;
    contentType: string;
    fileSize: number;
}

export interface ProfileImageUploadResponse {
    uploadUrl: string;
    objectKey: string;
}

export interface ProfileImageConfirmRequest {
    objectKey: string;
}

export interface HostResponseDTO {
    id: string;
    username: string;
    displayName: string;
    job?: string;
    profileImageUrl?: string;
    chatCount: number;
}

export interface UpdateProfilePayload {
    job?: string;
    profileImageUrl?: string;
}
