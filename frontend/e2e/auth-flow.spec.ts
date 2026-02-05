import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test('full signup -> login -> home -> logout flow', async ({ page }) => {
    test.slow();

    const suffix = String(Date.now()).slice(-6);
    const username = `af${suffix}`;
    const email = `af${suffix}@test.com`;
    const password = 'test1234';
    const displayName = 'E2E User';

    // 1. Navigate to signup page
    await page.goto('/app/signup');
    await expect(page.getByRole('heading', { name: '회원가입' })).toBeVisible();

    // 2. Fill in signup form
    await page.locator('#username').fill(username);
    await page.locator('#email').fill(email);
    await page.locator('#displayName').fill(displayName);
    await page.locator('#password').fill(password);
    await page.locator('#passwordAgain').fill(password);

    // 3. Submit signup form
    await page.getByRole('button', { name: '회원가입' }).click();

    // 4. Verify signup success message
    await expect(
      page.getByText('회원가입 성공! 로그인 페이지로 이동합니다...'),
    ).toBeVisible();

    // 5. Wait for redirect to login page (~1.5s)
    await page.waitForURL('**/app/login', { timeout: 5000 });
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();

    // 6. Fill in login form with same credentials
    await page.locator('#username').fill(username);
    await page.locator('#password').fill(password);

    // 7. Submit login form
    await page.getByRole('button', { name: '로그인' }).click();

    // 8. Verify redirect to home page
    await page.waitForURL('**/app', { timeout: 5000 });
    await expect(
      page.getByRole('heading', { name: '약속 잡기 서비스' }),
    ).toBeVisible();

    // 9. Verify logout button is visible (user is logged in)
    const logoutButton = page.getByRole('button', { name: '로그아웃' });
    await expect(logoutButton).toBeVisible();

    // 10. Click logout
    await logoutButton.click();

    // 11. Verify redirect to login page
    await page.waitForURL('**/app/login', { timeout: 5000 });
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
  });
});
