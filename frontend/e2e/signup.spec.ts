import { test, expect } from '@playwright/test';

test.describe('Signup Flow', () => {
  const uniqueUser = () => {
    const suffix = String(Date.now()).slice(-6);
    return {
      username: `u${suffix}`,
      email: `u${suffix}@test.com`,
      displayName: `TestUser`,
      password: `pass${suffix}`,
    };
  };

  test('should display the signup form', async ({ page }) => {
    await page.goto('/app/signup');

    const heading = page.locator('h2', { hasText: '회원가입' });
    await expect(heading).toBeVisible();

    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#displayName')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#passwordAgain')).toBeVisible();

    const submitButton = page.getByRole('button', { name: '회원가입' });
    await expect(submitButton).toBeVisible();
  });

  test('should complete signup and redirect to login', async ({ page }) => {
    const user = uniqueUser();

    await page.goto('/app/signup');

    // Verify the signup form heading is visible
    const heading = page.locator('h2', { hasText: '회원가입' });
    await expect(heading).toBeVisible();

    // Fill in the signup form
    await page.locator('#username').fill(user.username);
    await page.locator('#email').fill(user.email);
    await page.locator('#displayName').fill(user.displayName);
    await page.locator('#password').fill(user.password);
    await page.locator('#passwordAgain').fill(user.password);

    // Submit the form
    const submitButton = page.getByRole('button', { name: '회원가입' });
    await submitButton.click();

    // Verify success message appears
    const successMessage = page.locator('text=회원가입 성공!');
    await expect(successMessage).toBeVisible({ timeout: 10_000 });

    // Verify redirect to login page after 1.5 seconds
    await expect(page).toHaveURL(/\/app\/login/, { timeout: 5_000 });
  });

  test('should show error when passwords do not match', async ({ page }) => {
    await page.goto('/app/signup');

    const user = uniqueUser();

    await page.locator('#username').fill(user.username);
    await page.locator('#email').fill(user.email);
    await page.locator('#password').fill(user.password);
    await page.locator('#passwordAgain').fill('different_password');

    const submitButton = page.getByRole('button', { name: '회원가입' });
    await submitButton.click();

    const errorMessage = page.locator('text=비밀번호가 일치하지 않습니다.');
    await expect(errorMessage).toBeVisible();
  });

  test('should have a link to login page', async ({ page }) => {
    await page.goto('/app/signup');

    const loginLink = page.getByRole('link', { name: '로그인' });
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute('href', /\/app\/login/);
  });
});
