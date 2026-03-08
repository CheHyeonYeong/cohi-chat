export type Role = 'GUEST' | 'HOST' | 'ADMIN';

export interface MemberResponseDTO {
    id: string; // UUID
    username: string;
    displayName: string;
    email: string;
    role: Role;
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
