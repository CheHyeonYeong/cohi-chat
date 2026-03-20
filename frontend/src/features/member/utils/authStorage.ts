import type { LoginResponse } from '../types';
import { dispatchAuthChange } from './authEvent';

const USERNAME_KEY = 'username';

export function saveAuthenticatedUser(response: Pick<LoginResponse, 'username'>): void {
    localStorage.setItem(USERNAME_KEY, response.username);
    dispatchAuthChange();
}

export function getStoredUsername(): string | null {
    return localStorage.getItem(USERNAME_KEY);
}

export function clearAuthenticatedUser(): void {
    localStorage.removeItem(USERNAME_KEY);
    dispatchAuthChange();
}
