import { expect, test } from '@playwright/test';

test('home page smoke', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /discover your ideal career path/i })).toBeVisible();
  await expect(page.getByText(/ai-powered platform analyses your skills/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
});

test('courses page smoke', async ({ page }) => {
  await page.route('**/api/course-categories*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          { _id: 'cat-1', name: 'Engineering', slug: 'engineering', description: '', sortOrder: 1, isActive: true },
        ],
      }),
    });
  });

  await page.route('**/api/courses*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          items: [
            {
              _id: 'course-1',
              slug: 'typescript-fundamentals',
              title: 'TypeScript Fundamentals',
              shortDescription: 'Learn the basics of TypeScript.',
              fullDescription: 'A practical overview of TypeScript for app development.',
              categoryName: 'Engineering',
              difficulty: 'Beginner',
              platform: 'Coursera',
              instructor: 'Nextaro Academy',
              durationLabel: '4 hours',
              courseUrl: 'https://example.com/course',
              thumbnailUrl: '',
              tags: ['typescript', 'frontend'],
              categoryId: 'cat-1',
              isFree: true,
              featured: true,
              viewCount: 0,
              redirectCount: 0,
              createdAt: new Date().toISOString(),
            },
          ],
        },
      }),
    });
  });

  await page.goto('/courses');

  await expect(page.getByRole('heading', { name: /curated learning resources for career growth/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /course library/i })).toBeVisible();
  await expect(page.getByText('TypeScript Fundamentals')).toBeVisible();
});