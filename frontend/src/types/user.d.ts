import {ISO8601String} from "./base";

export type Role = 'GUEST' | 'HOST' | 'ADMIN';

export interface MemberResponseDTO {
    id: string; // UUID
    username: string;
    displayName: string;
    email: string;
    role: Role;
    createdAt: ISO8601String;
    updatedAt: ISO8601String;
}

export interface IUserSimple {
    username: string;
    displayName: string;
    role: Role;
}
