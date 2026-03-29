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
