import { test, expect } from '@playwright/test';

const apiBase = process.env.PLAYWRIGHT_API_BASE || 'http://localhost:5000';
const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2X1vQAAAAASUVORK5CYII=',
  'base64',
);

async function bootstrapSession(page: any, fullName: string) {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const password = 'Test1234!';

  // Signup (email sending is disabled in dev by default)
  const signupResp = await page.request.post(`${apiBase}/api/auth/signup`, {
    data: { fullName, email, password },
  });
  if (signupResp.status() >= 400) {
    const body = await signupResp.text();
    throw new Error(`Signup failed: ${signupResp.status()} ${body}`);
  }
  const signupJson = await signupResp.json();

  // Login
  const loginResp = await page.request.post(`${apiBase}/api/auth/login`, {
    data: { email, password },
  });
  if (loginResp.status() >= 400) {
    const body = await loginResp.text();
    throw new Error(`Login failed: ${loginResp.status()} ${body}`);
  }
  const loginJson = await loginResp.json();
  const token = loginJson.token;

  // Persist token in localStorage before the page loads
  await page.addInitScript((t) => {
    // @ts-expect-error
    localStorage.setItem('nextro_token', t);
  }, token);

  return { token, userId: signupJson.user.id, email, password };
}

async function openProfileEditor(page: any) {
  await page.goto('/profile/edit');
  await page.waitForSelector('text=System Settings', { timeout: 10000 });
}

async function mockPublicProfileDependencies(page: any, userId: string) {
  await page.route(`**/api/skills/${userId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        profile: {
          userId,
          skillsOffered: [],
          skillsWanted: [],
          bio: 'Public profile bio',
          hourlyRate: 0,
          isActive: true,
        },
      }),
    });
  });

  await page.route(`**/api/reviews/${userId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ reviews: [] }),
    });
  });
}

test('profile edit flow (integration)', async ({ page }) => {
  // Use the real backend: sign up and log in to get a token
  const { token } = await bootstrapSession(page, 'E2E User');

  // Now navigate to the profile editor and perform edits
  await openProfileEditor(page);

  // Fill display name
  await page.getByRole('textbox').first().fill('E2E Tester');

  // Click Save Profile
  await page.click('button:has-text("Save Profile")');

  // Verify the success toast appears
  await expect(page.locator('text=Settings saved successfully')).toBeVisible({ timeout: 5000 });

  // Cleanup: delete account via API
  await page.request.delete(`${apiBase}/api/profile`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
});

test('privacy toggle persists on real backend', async ({ page }) => {
  const { token } = await bootstrapSession(page, 'Privacy Tester');

  await openProfileEditor(page);

  const publicProfileToggle = page.locator('button[aria-pressed]').first();
  await expect(publicProfileToggle).toHaveAttribute('aria-pressed', 'true');

  await publicProfileToggle.click();
  await page.click('button:has-text("Save Profile")');
  await expect(page.locator('text=Settings saved successfully')).toBeVisible({ timeout: 5000 });

  await page.reload();
  await openProfileEditor(page);
  await expect(page.locator('button[aria-pressed]').first()).toHaveAttribute('aria-pressed', 'false');

  await page.request.delete(`${apiBase}/api/profile`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
});

test('profile photo upload updates the live profile', async ({ page }) => {
  const { token } = await bootstrapSession(page, 'Photo Tester');

  await openProfileEditor(page);

  await page.locator('button:has-text("Change photo")').click();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'avatar.png',
    mimeType: 'image/png',
    buffer: tinyPng,
  });

  await expect(page.locator('text=Profile photo updated')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('img[alt="Profile"]')).toBeVisible();

  await page.request.delete(`${apiBase}/api/profile`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
});

test('public profile view renders live profile data', async ({ page, browser }) => {
  const { token, userId } = await bootstrapSession(page, 'Public Viewer');

  await openProfileEditor(page);
  await page.getByRole('textbox').first().fill('Public Viewer');
  await page.click('button:has-text("Save Profile")');
  await expect(page.locator('text=Settings saved successfully')).toBeVisible({ timeout: 5000 });

  const anonContext = await browser.newContext();
  const anonPage = await anonContext.newPage();
  await mockPublicProfileDependencies(anonPage, userId);

  await anonPage.goto(`/profile/${userId}`);
  await expect(anonPage.getByRole('heading', { name: 'Public Viewer' })).toBeVisible({ timeout: 10000 });
  await expect(anonPage.getByText('This professional is currently crafting their mission statement.')).toBeVisible();

  await anonContext.close();
  await page.request.delete(`${apiBase}/api/profile`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
});
