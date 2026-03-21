import type { LoginResponse } from '../types';
import { dispatchAuthChange } from './authEvent';

export function saveAuthenticatedUser(response: Pick<LoginResponse, 'username'>): void {
    void response;
    dispatchAuthChange();
}

export function clearAuthenticatedUser(): void {
    dispatchAuthChange();
}
