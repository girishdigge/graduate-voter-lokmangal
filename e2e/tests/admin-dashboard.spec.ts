import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock admin login
    await page.route('**/api/admin/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            admin: {
              id: '1',
              username: 'admin',
              role: 'admin',
            },
            token: 'mock-admin-token',
          },
        }),
      });
    });

    // Mock admin stats
    await page.route('**/api/admin/stats', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            totalVoters: 1250,
            verifiedVoters: 980,
            unverifiedVoters: 270,
            totalReferences: 3200,
          },
        }),
      });
    });
  });

  test('should login and display dashboard stats', async ({ page }) => {
    // Navigate to admin portal
    await page.goto('http://localhost:5174');

    // Fill login form
    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel(/password/i).fill('password');
    await page.getByRole('button', { name: /login/i }).click();

    // Expect to be redirected to dashboard
    await expect(page).toHaveURL(/.*dashboard.*/);

    // Check that stats are displayed
    await expect(page.getByText('1,250')).toBeVisible(); // Total voters
    await expect(page.getByText('980')).toBeVisible(); // Verified voters
    await expect(page.getByText('270')).toBeVisible(); // Unverified voters
    await expect(page.getByText('3,200')).toBeVisible(); // Total references
  });

  test('should navigate to voters management', async ({ page }) => {
    // Mock voters list
    await page.route('**/api/admin/voters*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            voters: [
              {
                id: '1',
                fullName: 'John Doe',
                aadharNumber: '123456789012',
                contact: '9876543210',
                isVerified: false,
                createdAt: '2024-01-01T00:00:00Z',
              },
            ],
            total: 1,
            page: 1,
            limit: 10,
          },
        }),
      });
    });

    await page.goto('http://localhost:5174');

    // Login
    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel(/password/i).fill('password');
    await page.getByRole('button', { name: /login/i }).click();

    // Navigate to voters
    await page.getByRole('link', { name: /voters/i }).click();

    // Check that voters table is displayed
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('123456789012')).toBeVisible();
    await expect(page.getByText('9876543210')).toBeVisible();
  });

  test('should search for voters', async ({ page }) => {
    // Mock search results
    await page.route('**/api/admin/search/voters*', async route => {
      const url = new URL(route.request().url());
      const query = url.searchParams.get('q');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            voters:
              query === 'John'
                ? [
                    {
                      id: '1',
                      fullName: 'John Doe',
                      aadharNumber: '123456789012',
                      contact: '9876543210',
                      isVerified: false,
                    },
                  ]
                : [],
            total: query === 'John' ? 1 : 0,
          },
        }),
      });
    });

    await page.goto('http://localhost:5174');

    // Login and navigate to voters
    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel(/password/i).fill('password');
    await page.getByRole('button', { name: /login/i }).click();
    await page.getByRole('link', { name: /voters/i }).click();

    // Search for a voter
    await page.getByPlaceholder(/search voters/i).fill('John');
    await page.getByRole('button', { name: /search/i }).click();

    // Check search results
    await expect(page.getByText('John Doe')).toBeVisible();
  });

  test('should verify a voter', async ({ page }) => {
    // Mock voter verification
    await page.route('**/api/admin/voters/*/verify', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            message: 'Voter verified successfully',
          },
        }),
      });
    });

    await page.goto('http://localhost:5174');

    // Login and navigate to voters
    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel(/password/i).fill('password');
    await page.getByRole('button', { name: /login/i }).click();
    await page.getByRole('link', { name: /voters/i }).click();

    // Click verify button for a voter
    await page
      .getByRole('button', { name: /verify/i })
      .first()
      .click();

    // Expect success message
    await expect(page.getByText(/verified successfully/i)).toBeVisible();
  });
});
