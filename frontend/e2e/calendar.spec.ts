import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:8080';

function uniqueUser() {
  const suffix = String(Date.now()).slice(-6);
  return {
    username: `ca${suffix}`,
    password: 'Test1234',
    email: `ca${suffix}@test.com`,
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

test.describe('CALENDAR page', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/app/calendar/hostuser');

    await page.waitForURL('**/app/login', { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
  });

  test('loads with auth and shows heading', async ({ page, request }) => {
    const { accessToken, username } = await signupAndLogin(request);
    await setAuth(page, accessToken, username);

    await page.goto('/app/calendar/hostuser');

    const heading = page.locator('h2');
    await expect(heading).toContainText('hostuser', { timeout: 10_000 });
    await expect(heading).toContainText('약속잡기');
  });

  test('has navigation links', async ({ page, request }) => {
    const { accessToken, username } = await signupAndLogin(request);
    await setAuth(page, accessToken, username);

    await page.goto('/app/calendar/hostuser');

    const homeLink = page.getByRole('link', { name: '첫 화면으로' });
    await expect(homeLink).toBeVisible({ timeout: 10_000 });
    await expect(homeLink).toHaveAttribute('href', /\/app$/);

    const bookingsLink = page.getByRole('link', { name: '내 예약 목록' });
    await expect(bookingsLink).toBeVisible();
    await expect(bookingsLink).toHaveAttribute('href', /\/app\/my-bookings/);
  });
});
