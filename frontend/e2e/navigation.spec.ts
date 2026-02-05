import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:8080/api/members/v1';

function uniqueUser() {
  const suffix = String(Date.now()).slice(-6);
  return {
    username: `nv${suffix}`,
    password: 'Test1234',
    email: `nv${suffix}@test.com`,
    displayName: `NavUser`,
  };
}

async function signupAndLogin(user: ReturnType<typeof uniqueUser>) {
  const signupRes = await fetch(`${API_BASE}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!signupRes.ok) {
    throw new Error(`Signup failed: ${signupRes.status} ${await signupRes.text()}`);
  }

  const loginRes = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: user.username,
      password: user.password,
      provider: 'LOCAL',
    }),
  });
  if (!loginRes.ok) {
    throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
  }

  const data = await loginRes.json();
  return { accessToken: data.accessToken, username: data.username };
}

test.describe('Navigation between pages', () => {
  test('login page has signup link', async ({ page }) => {
    await page.goto('/app/login');

    const signupLink = page.getByRole('link', { name: '회원가입' });
    await expect(signupLink).toBeVisible();
    await signupLink.click();

    await expect(page).toHaveURL(/\/app\/signup/);
  });

  test('signup page has login link', async ({ page }) => {
    await page.goto('/app/signup');

    const loginLink = page.getByRole('link', { name: '로그인' });
    await expect(loginLink).toBeVisible();
    await loginLink.click();

    await expect(page).toHaveURL(/\/app\/login/);
  });

  test('my-bookings page has home link', async ({ page }) => {
    const user = uniqueUser();
    const auth = await signupAndLogin(user);

    await page.addInitScript(
      ({ token, username }) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('username', username);
      },
      { token: auth.accessToken, username: auth.username },
    );

    await page.goto('/app/my-bookings');

    const homeLink = page.getByRole('link', { name: '첫 화면으로' });
    await expect(homeLink).toBeVisible();
    await homeLink.click();

    await expect(page).toHaveURL(/\/app$/);
  });

  test('calendar page has home and my-bookings links', async ({ page }) => {
    const user = uniqueUser();
    const auth = await signupAndLogin(user);

    await page.addInitScript(
      ({ token, username }) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('username', username);
      },
      { token: auth.accessToken, username: auth.username },
    );

    await page.goto(`/app/calendar/${auth.username}`);

    const homeLink = page.getByRole('link', { name: '첫 화면으로' });
    await expect(homeLink).toBeVisible();

    const myBookingsLink = page.getByRole('link', { name: '내 예약 목록' });
    await expect(myBookingsLink).toBeVisible();
  });
});
