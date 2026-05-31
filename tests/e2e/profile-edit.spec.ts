import { test, expect } from '@playwright/test';

test('profile edit flow (integration)', async ({ page }) => {
  // Use the real backend: sign up and log in to get a token
  const apiBase = process.env.PLAYWRIGHT_API_BASE || 'http://localhost:5000';
  const email = `e2e+${Date.now()}@example.com`;
  const password = 'Test1234!';

  // Signup (email sending is disabled in dev by default)
  const signupResp = await page.request.post(`${apiBase}/api/auth/signup`, {
    data: { fullName: 'E2E User', email, password },
  });
  if (signupResp.status() >= 400) {
    const body = await signupResp.text();
    throw new Error(`Signup failed: ${signupResp.status()} ${body}`);
  }

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
    // @ts-ignore
    localStorage.setItem('nextro_token', t);
  }, token);

  // Now navigate to the profile editor and perform edits
  await page.goto('/profile/edit');

  // Wait for settings UI to load
  await page.waitForSelector('text=System Settings', { timeout: 10000 });

  // Fill display name
  await page.fill('input[placeholder="Display Name"], input[value^=""]', 'E2E Tester');

  // Click Save Profile
  await page.click('button:has-text("Save Profile")');

  // Verify the success toast appears
  await expect(page.locator('text=Settings saved successfully')).toBeVisible({ timeout: 5000 });

  // Cleanup: delete account via API
  await page.request.delete(`${apiBase}/api/profile`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
});
