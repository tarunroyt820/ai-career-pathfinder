import { expect, test } from '@playwright/test';

const course = {
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
};

test('courses list renders featured resources', async ({ page }) => {
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
          items: [course],
          page: 1,
          limit: 24,
          total: 1,
          totalPages: 1,
        },
      }),
    });
  });

  await page.goto('/courses');

  await expect(page.getByRole('heading', { name: /curated learning resources for career growth/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /course library/i })).toBeVisible();
  await expect(page.getByText('TypeScript Fundamentals')).toBeVisible();
  await expect(page.getByRole('link', { name: /view details/i })).toBeVisible();
});

test('course details page renders course metadata', async ({ page }) => {
  await page.route('**/api/courses/typescript-fundamentals', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          course,
          relatedCourses: [
            {
              ...course,
              _id: 'course-2',
              slug: 'modern-react-patterns',
              title: 'Modern React Patterns',
            },
          ],
        },
      }),
    });
  });

  await page.route('**/api/courses/course-1/view', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
  });

  await page.route('**/api/courses/course-1/redirect', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
  });

  await page.goto('/courses/typescript-fundamentals');

  await expect(page.getByRole('heading', { name: 'TypeScript Fundamentals' })).toBeVisible();
  await expect(page.getByText('About this resource')).toBeVisible();
  await expect(page.getByRole('button', { name: /open on coursera/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /more in engineering/i })).toBeVisible();
});