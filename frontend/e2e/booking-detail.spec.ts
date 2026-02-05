import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:8080/api';

function createUniqueUser(role?: string) {
  const suffix = String(Date.now()).slice(-6);
  const prefix = role === 'HOST' ? 'h' : 'g';
  return {
    username: `${prefix}${suffix}`,
    password: 'Test1234',
    email: `${prefix}${suffix}@test.com`,
    displayName: `TestUser`,
    role: role || 'GUEST',
  };
}

async function signupUser(
  request: import('@playwright/test').APIRequestContext,
  user: ReturnType<typeof createUniqueUser>,
) {
  const response = await request.post(`${API_BASE}/members/v1/signup`, {
    data: {
      username: user.username,
      password: user.password,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    },
  });

  if (!response.ok()) {
    throw new Error(`Signup failed: ${response.status()} ${await response.text()}`);
  }

  return response.json();
}

async function loginUser(
  request: import('@playwright/test').APIRequestContext,
  username: string,
  password: string,
) {
  const response = await request.post(`${API_BASE}/members/v1/login`, {
    data: { username, password },
  });

  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()} ${await response.text()}`);
  }

  return response.json() as Promise<{ accessToken: string; username: string }>;
}

function setAuth(
  page: import('@playwright/test').Page,
  token: string,
  username: string,
) {
  return page.addInitScript(
    ({ token, username }) => {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('username', username);
    },
    { token, username },
  );
}

test.describe('BOOKING DETAIL page', () => {
  test('shows loading state then error for non-existent booking', async ({
    page,
    request,
  }) => {
    const user = createUniqueUser();
    await signupUser(request, user);
    const loginResponse = await loginUser(request, user.username, user.password);
    await setAuth(page, loginResponse.accessToken, loginResponse.username);

    await page.goto('/app/booking/999');

    // Verify loading message appears
    await expect(page.getByTestId('loading')).toBeVisible();
    await expect(page.getByTestId('loading')).toContainText(
      '예약 정보를 불러오고 있습니다...',
    );

    // Then verify error message appears after loading completes
    await expect(page.getByTestId('error')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('error')).toContainText(
      '예약 정보를 불러오는 중 오류가 발생했습니다.',
    );
  });

  test('has back link to my-bookings', async ({ page, request }) => {
    const user = createUniqueUser();
    await signupUser(request, user);
    const loginResponse = await loginUser(request, user.username, user.password);
    await setAuth(page, loginResponse.accessToken, loginResponse.username);

    await page.goto('/app/booking/1');

    const backLink = page.getByRole('link', { name: '내 예약 목록으로' });
    await expect(backLink).toBeVisible({ timeout: 10_000 });
    await expect(backLink).toHaveAttribute('href', '/app/my-bookings');
  });

  test('shows booking detail when valid booking exists', async ({
    page,
    request,
  }) => {
    // Step a: Create a host user
    const hostUser = createUniqueUser('HOST');
    await signupUser(request, hostUser);
    const hostLogin = await loginUser(
      request,
      hostUser.username,
      hostUser.password,
    );

    // Step b: Create a guest user
    const guestUser = createUniqueUser();
    await signupUser(request, guestUser);

    // Step c: Login as host, create a calendar
    const calendarResponse = await request.post(`${API_BASE}/calendar/v1`, {
      headers: {
        Authorization: `Bearer ${hostLogin.accessToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        topics: ['테스트'],
        description: '테스트 캘린더 설명입니다',
        googleCalendarId: 'test@group.calendar.google.com',
      },
    });

    if (!calendarResponse.ok()) {
      throw new Error(
        `Calendar creation failed: ${calendarResponse.status()} ${await calendarResponse.text()}`,
      );
    }

    // Step d: Create a timeslot
    const timeslotResponse = await request.post(`${API_BASE}/timeslot/v1`, {
      headers: {
        Authorization: `Bearer ${hostLogin.accessToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        startTime: '09:00:00',
        endTime: '10:00:00',
        weekdays: [1, 2, 3, 4],
      },
    });

    if (!timeslotResponse.ok()) {
      throw new Error(
        `Timeslot creation failed: ${timeslotResponse.status()} ${await timeslotResponse.text()}`,
      );
    }

    const timeslotData = await timeslotResponse.json();
    const timeSlotId = timeslotData.id;

    // Step e: Login as guest, create a booking
    const guestLogin = await loginUser(
      request,
      guestUser.username,
      guestUser.password,
    );

    const bookingResponse = await request.post(`${API_BASE}/bookings`, {
      headers: {
        Authorization: `Bearer ${guestLogin.accessToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        timeSlotId,
        when: '2026-03-02',
        topic: '테스트',
        description: '테스트 설명',
      },
    });

    if (!bookingResponse.ok()) {
      throw new Error(
        `Booking creation failed: ${bookingResponse.status()} ${await bookingResponse.text()}`,
      );
    }

    const booking = await bookingResponse.json();
    const bookingId = booking.id;

    // Step f: Set auth as guest and navigate to booking detail
    await setAuth(page, guestLogin.accessToken, guestLogin.username);
    await page.goto(`/app/booking/${bookingId}`);

    // Wait for loading to finish
    await expect(page.getByTestId('loading')).toBeHidden({ timeout: 10_000 });

    // Step g: Verify booking details are shown
    await expect(page.getByText('예약 상세')).toBeVisible();
    await expect(page.getByText('테스트').first()).toBeVisible();
    await expect(page.getByText('2026-03-02')).toBeVisible();
    await expect(page.getByText('09:00:00 - 10:00:00')).toBeVisible();
    await expect(page.getByText('SCHEDULED')).toBeVisible();
    await expect(page.getByText('테스트 설명')).toBeVisible();
  });
});
