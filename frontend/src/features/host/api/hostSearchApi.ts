import type { HostResponseDTO } from '~/features/member';
import { httpClient } from '~/libs/httpClient';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const getHosts = async () => httpClient<HostResponseDTO[]>(`${API_BASE}/members/v1/hosts`);

export const searchHosts = async (query: string) =>
    httpClient<HostResponseDTO[]>(`${API_BASE}/members/v1/hosts/search?query=${encodeURIComponent(query)}`);
