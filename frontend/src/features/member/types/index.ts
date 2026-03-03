import { ISO8601String } from '~/types/base';

export type Role = 'GUEST' | 'HOST' | 'ADMIN';

export interface MemberResponseDTO {
    id: string;
    username: string;
    displayName: string;
    email: string;
    role: Role;
    createdAt: ISO8601String;
    updatedAt: ISO8601String;
}

export interface HostResponseDTO {
    id: string;
    username: string;
    displayName: string;
    job?: string;
    profileImageUrl?: string;
    chatCount: number;
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
    accessToken: string;
    expiredInMinutes: number;
    refreshToken: string;
    username: string;
    displayName: string;
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

export interface UpdateProfilePayload {
    job?: string;
    profileImageUrl?: string;
}

export interface UpdateMemberPayload {
    displayName?: string;
    password?: string;
}
