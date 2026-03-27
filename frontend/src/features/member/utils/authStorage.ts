import type { LoginResponse } from '../types';
import { dispatchAuthChange } from './authEvent';

const USERNAME_KEY = 'username';

export const saveAuthenticatedUser = (response: Pick<LoginResponse, 'username'>): void => {
    localStorage.setItem(USERNAME_KEY, response.username);
    dispatchAuthChange();
};

export const getStoredUsername = (): string | null => localStorage.getItem(USERNAME_KEY);

export const clearAuthenticatedUser = (): void => {
    localStorage.removeItem(USERNAME_KEY);
    dispatchAuthChange();
};
