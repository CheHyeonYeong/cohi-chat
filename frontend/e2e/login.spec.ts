import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:8080/api';

function generateTestUser() {
  const suffix = String(Date.now()).slice(-6);
  return {
    username: `tu${suffix}`,
    password: 'TestPass1234',
    email: `tu${suffix}@test.com`,
    displayName: `TestUser`,
  };
}

test.describe('Login flow', () => {
  let testUser: ReturnType<typeof generateTestUser>;

  test.beforeAll(async () => {
    testUser = generateTestUser();

    const response = await fetch(`${API_URL}/members/v1/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to create test user: ${response.status} ${await response.text()}`,
      );
    }
  });

  test('successful login', async ({ page }) => {
    await page.goto('/app/login');

    // Verify login form is visible
    await expect(page.locator('h2', { hasText: '로그인' })).toBeVisible();

    // Fill in credentials
    await page.locator('#username').fill(testUser.username);
    await page.locator('#password').fill(testUser.password);

    // Click the login button
    await page.getByRole('button', { name: '로그인' }).click();

    // Verify redirect to /app (home page)
    await expect(page).toHaveURL(/\/app\/?$/);

    // Verify localStorage has auth_token set
    const authToken = await page.evaluate(() =>
      localStorage.getItem('auth_token'),
    );
    expect(authToken).toBeTruthy();
  });

  test('failed login with wrong password', async ({ page }) => {
    await page.goto('/app/login');

    // Fill in username with wrong password
    await page.locator('#username').fill(testUser.username);
    await page.locator('#password').fill('WrongPass999');

    // Click login
    await page.getByRole('button', { name: '로그인' }).click();

    // Verify error message appears
    await expect(
      page.getByText('로그인에 실패했습니다'),
    ).toBeVisible();
  });

  test('navigate to signup from login', async ({ page }) => {
    await page.goto('/app/login');

    // Click the signup link
    await page.getByRole('link', { name: '회원가입' }).click();

    // Verify URL is /app/signup
    await expect(page).toHaveURL(/\/app\/signup/);
  });
});
