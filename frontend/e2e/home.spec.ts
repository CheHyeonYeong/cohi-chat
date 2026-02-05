import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:8080/api';

function generateTestUser() {
  const suffix = String(Date.now()).slice(-6);
  return {
    username: `hm${suffix}`,
    password: 'TestPass1234',
    email: `hm${suffix}@test.com`,
    displayName: `HomeTest`,
  };
}

test.describe('Home Page', () => {
  test('home page loads and shows title', async ({ page }) => {
    await page.goto('/app');

    await expect(
      page.getByRole('heading', { level: 1, name: '약속 잡기 서비스' }),
    ).toBeVisible();
  });

  test('shows hosts list', async ({ page }) => {
    await page.goto('/app');

    // Wait for loading to finish and hosts list to be populated
    const hostsList = page.getByTestId('hosts-list');
    await expect(hostsList).toBeVisible();

    // Wait for at least one host link to appear (backend has hostuser, host2, testhost)
    const hostLinks = hostsList.getByRole('link');
    await expect(hostLinks.first()).toBeVisible({ timeout: 10000 });

    // Verify at least one host is displayed
    const count = await hostLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Verify each host link follows the "{displayName} ({username})" format
    const firstLinkText = await hostLinks.first().textContent();
    expect(firstLinkText).toMatch(/.+\s\(.+\)/);
  });

  test('host links navigate to calendar', async ({ page }) => {
    await page.goto('/app');

    // Wait for hosts list to load
    const hostsList = page.getByTestId('hosts-list');
    await expect(hostsList).toBeVisible();

    const hostLinks = hostsList.getByRole('link');
    await expect(hostLinks.first()).toBeVisible({ timeout: 10000 });

    // Extract the username from the first host link text (format: "displayName (username)")
    const linkText = await hostLinks.first().textContent();
    const usernameMatch = linkText?.match(/\(([^)]+)\)/);
    expect(usernameMatch).toBeTruthy();
    const username = usernameMatch![1];

    // Click the first host link
    await hostLinks.first().click();

    // Verify URL changes to /app/calendar/{username}
    await expect(page).toHaveURL(new RegExp(`/app/calendar/${username}`));
  });

  test('redirect from / to /app', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/app\/?$/);
  });

  test('shows login button when not logged in', async ({ page }) => {
    // Clear any existing auth state
    await page.goto('/app');
    await page.evaluate(() => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('username');
    });
    await page.reload();

    await expect(
      page.getByRole('link', { name: '로그인' }),
    ).toBeVisible();
  });

  test('shows logout button when logged in', async ({ page }) => {
    // Create a unique test user via API
    const testUser = generateTestUser();

    const signupResponse = await fetch(`${API_URL}/members/v1/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    if (!signupResponse.ok) {
      throw new Error(
        `Failed to create test user: ${signupResponse.status} ${await signupResponse.text()}`,
      );
    }

    // Login via API to get token
    const loginResponse = await fetch(`${API_URL}/members/v1/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUser.username,
        password: testUser.password,
        provider: 'LOCAL',
      }),
    });
    if (!loginResponse.ok) {
      throw new Error(
        `Failed to login test user: ${loginResponse.status} ${await loginResponse.text()}`,
      );
    }
    const loginData = await loginResponse.json();

    // Set auth token in localStorage before navigating
    await page.goto('/app');
    await page.evaluate(
      ({ token, username }) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('username', username);
      },
      { token: loginData.accessToken, username: testUser.username },
    );
    await page.reload();

    // Verify logout button is visible
    await expect(
      page.getByRole('button', { name: '로그아웃' }),
    ).toBeVisible();
  });
});
