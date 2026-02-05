import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:8080/api';

function createUniqueUser() {
    const suffix = String(Date.now()).slice(-6);
    return {
        username: `lo${suffix}`,
        password: 'Test1234',
        email: `lo${suffix}@test.com`,
        displayName: `TestUser`,
    };
}

async function signupUser(user: {
    username: string;
    password: string;
    email: string;
    displayName: string;
}) {
    const response = await fetch(`${API_BASE}/members/v1/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
    });

    if (!response.ok) {
        throw new Error(`Signup failed: ${response.status} ${await response.text()}`);
    }

    return response.json();
}

async function loginUser(username: string, password: string) {
    const response = await fetch(`${API_BASE}/members/v1/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
        throw new Error(`Login failed: ${response.status} ${await response.text()}`);
    }

    return response.json() as Promise<{ accessToken: string; username: string }>;
}

test.describe('Logout flow', () => {
    let token: string;
    let user: ReturnType<typeof createUniqueUser>;

    test.beforeEach(async () => {
        user = createUniqueUser();
        await signupUser(user);
        const loginResponse = await loginUser(user.username, user.password);
        token = loginResponse.accessToken;
    });

    test('logout redirects to login page and clears localStorage', async ({ page }) => {
        // Set localStorage before navigation using addInitScript
        await page.addInitScript(
            ({ token, username }) => {
                localStorage.setItem('auth_token', token);
                localStorage.setItem('username', username);
            },
            { token, username: user.username },
        );

        // Navigate to the home page
        await page.goto('/app');

        // Click the logout button
        const logoutButton = page.getByRole('button', { name: '로그아웃' });
        await expect(logoutButton).toBeVisible();
        await logoutButton.click();

        // Verify redirect to login page
        await expect(page).toHaveURL(/\/app\/login/);

        // Verify localStorage no longer has auth-related items
        const authToken = await page.evaluate(() => localStorage.getItem('auth_token'));
        const refreshToken = await page.evaluate(() => localStorage.getItem('refresh_token'));
        const username = await page.evaluate(() => localStorage.getItem('username'));

        expect(authToken).toBeNull();
        expect(refreshToken).toBeNull();
        expect(username).toBeNull();
    });
});
