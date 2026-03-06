import type { LoginResponse } from '../types';
import { dispatchAuthChange } from './authEvent';

export function saveAuthTokens(response: LoginResponse): void {
    localStorage.setItem('auth_token', response.accessToken);
    localStorage.setItem('refresh_token', response.refreshToken);
    localStorage.setItem('username', response.username);
    dispatchAuthChange();
}
