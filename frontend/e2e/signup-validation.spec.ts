import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:8080/api';

function uniqueUsername() {
  const suffix = String(Date.now()).slice(-6);
  return `sv${suffix}`;
}

async function createUserViaApi(username: string, password: string, email: string) {
  const response = await fetch(`${API_URL}/members/v1/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, email }),
  });
  return response;
}

test.describe('Signup form validation', () => {
  test('password mismatch shows error', async ({ page }) => {
    await page.goto('/app/signup');

    await page.locator('#username').fill('testuser1234');
    await page.locator('#email').fill('test@test.com');
    await page.locator('#password').fill('test1234');
    await page.locator('#passwordAgain').fill('different');

    await page.getByRole('button', { name: '회원가입' }).click();

    await expect(
      page.getByText('비밀번호가 일치하지 않습니다.'),
    ).toBeVisible();
  });

  test('all required fields must be filled', async ({ page }) => {
    await page.goto('/app/signup');

    const usernameInput = page.locator('#username');
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    const passwordAgainInput = page.locator('#passwordAgain');

    // Verify required attributes are present
    await expect(usernameInput).toHaveAttribute('required', '');
    await expect(emailInput).toHaveAttribute('required', '');
    await expect(passwordInput).toHaveAttribute('required', '');
    await expect(passwordAgainInput).toHaveAttribute('required', '');

    // Click submit without filling any fields
    await page.getByRole('button', { name: '회원가입' }).click();

    // HTML5 validation should prevent form submission.
    // The first required field (username) should show a validation message.
    const isInvalid = await usernameInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid,
    );
    expect(isInvalid).toBe(true);

    // Verify the page did not navigate away (form was not submitted)
    expect(page.url()).toContain('/app/signup');
  });

  test('duplicate username shows error', async ({ page }) => {
    const username = uniqueUsername();
    const password = 'password1234';
    const email = `${username}@test.com`;

    // Create a user via API first
    const response = await createUserViaApi(username, password, email);
    expect(response.ok).toBe(true);

    // Now try to signup with the same username
    await page.goto('/app/signup');

    await page.locator('#username').fill(username);
    await page.locator('#email').fill(`another_${email}`);
    await page.locator('#password').fill(password);
    await page.locator('#passwordAgain').fill(password);

    await page.getByRole('button', { name: '회원가입' }).click();

    await expect(
      page.getByText('회원가입에 실패했습니다. 다시 시도해주세요.'),
    ).toBeVisible();
  });

  test('displayName field is optional', async ({ page }) => {
    const username = uniqueUsername();
    const password = 'password1234';
    const email = `${username}@test.com`;

    await page.goto('/app/signup');

    await page.locator('#username').fill(username);
    await page.locator('#email').fill(email);
    // Intentionally leave displayName empty
    await page.locator('#password').fill(password);
    await page.locator('#passwordAgain').fill(password);

    await page.getByRole('button', { name: '회원가입' }).click();

    await expect(
      page.getByText('회원가입 성공! 로그인 페이지로 이동합니다...'),
    ).toBeVisible();
  });
});
