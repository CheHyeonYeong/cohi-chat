import { dispatchAuthChange } from './authEvent';

export function saveAuthenticatedUser(): void {
    dispatchAuthChange();
}

export function clearAuthenticatedUser(): void {
    dispatchAuthChange();
}
