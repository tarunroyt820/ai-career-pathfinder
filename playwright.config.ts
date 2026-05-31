import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  reporter: 'list',
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 0,
    baseURL: 'http://localhost:5173',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev:all',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
});
