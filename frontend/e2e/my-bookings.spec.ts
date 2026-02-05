import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:8080';

function uniqueUser() {
  const suffix = String(Date.now()).slice(-6);
  return {
    username: `mb${suffix}`,
    password: 'Test1234',
    email: `mb${suffix}@test.com`,
    displayName: `TestUser`,
  };
}

async function signupAndLogin(request: import('@playwright/test').APIRequestContext) {
  const user = uniqueUser();

  await request.post(`${API_BASE}/api/members/v1/signup`, {
    data: {
      username: user.username,
      password: user.password,
      email: user.email,
      displayName: user.displayName,
    },
  });

  const loginResponse = await request.post(`${API_BASE}/api/members/v1/login`, {
    data: {
      username: user.username,
      password: user.password,
      provider: 'LOCAL',
    },
  });

  const body = await loginResponse.json();
  return { accessToken: body.accessToken, username: body.username };
}

function setAuth(page: import('@playwright/test').Page, token: string, username: string) {
  return page.addInitScript(
    ({ token, username }) => {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('username', username);
    },
    { token, username },
  );
}

test.describe('MY BOOKINGS page', () => {
  test('shows empty state when no bookings', async ({ page, request }) => {
    const { accessToken, username } = await signupAndLogin(request);
    await setAuth(page, accessToken, username);

    await page.goto('/app/my-bookings');

    await expect(page.getByTestId('loading')).toBeHidden({ timeout: 10_000 });
    await expect(page.getByTestId('empty-bookings')).toBeVisible();
    await expect(page.getByTestId('empty-bookings')).toContainText('예약이 없습니다.');
  });

  test('shows error when not authenticated', async ({ page }) => {
    await page.goto('/app/my-bookings');

    await expect(page.getByTestId('error')).toBeVisible({ timeout: 10_000 });
  });

  test('shows page title', async ({ page, request }) => {
    const { accessToken, username } = await signupAndLogin(request);
    await setAuth(page, accessToken, username);

    await page.goto('/app/my-bookings');

    await expect(page.locator('h2').filter({ hasText: '내 예약 목록' })).toBeVisible({
      timeout: 10_000,
    });
  });
});
