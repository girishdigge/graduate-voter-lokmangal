import { test, expect } from '@playwright/test';

test.describe('Voter Enrollment Flow', () => {
  test('should complete the full enrollment process', async ({ page }) => {
    // Navigate to the public portal
    await page.goto('/');

    // Check that landing page loads
    await expect(page.getByText('Padhvidhar Matdar Sangh')).toBeVisible();

    // Click on "Check Aadhar" or similar button to open modal
    await page.getByRole('button', { name: /check.*aadhar/i }).click();

    // Fill in Aadhar number
    const aadharInput = page.getByLabel(/aadhar number/i);
    await aadharInput.fill('123456789012');

    // Submit Aadhar check
    await page.getByRole('button', { name: /check/i }).click();

    // Wait for response and expect to be redirected to enrollment
    await expect(page).toHaveURL(/.*enrollment.*/);

    // Fill personal information
    await page.getByLabel(/full name/i).fill('John Doe');
    await page.getByLabel(/sex/i).selectOption('MALE');
    await page.getByLabel(/contact/i).fill('9876543210');
    await page.getByLabel(/email/i).fill('john@example.com');

    // Fill date of birth
    await page.getByLabel(/date of birth/i).fill('1990-01-01');

    // Fill address information
    await page.getByLabel(/house number/i).fill('123');
    await page.getByLabel(/street/i).fill('Main Street');
    await page.getByLabel(/area/i).fill('Downtown');
    // City should default to PUNE
    await expect(page.getByLabel(/city/i)).toHaveValue('PUNE');
    await page.getByLabel(/state/i).fill('Maharashtra');
    await page.getByLabel(/pincode/i).fill('411001');

    // Fill education details
    await page.getByLabel(/university/i).fill('Pune University');
    await page.getByLabel(/graduation year/i).fill('2012');

    // Submit the form
    await page.getByRole('button', { name: /submit/i }).click();

    // Expect success message or redirect to dashboard
    await expect(page.getByText(/enrollment successful/i)).toBeVisible();
  });

  test('should validate Aadhar format', async ({ page }) => {
    await page.goto('/');

    // Open Aadhar check modal
    await page.getByRole('button', { name: /check.*aadhar/i }).click();

    // Enter invalid Aadhar
    await page.getByLabel(/aadhar number/i).fill('12345');
    await page.getByRole('button', { name: /check/i }).click();

    // Expect validation error
    await expect(
      page.getByText(/aadhar number must be exactly 12 digits/i)
    ).toBeVisible();
  });

  test('should handle existing user scenario', async ({ page }) => {
    // Mock API response for existing user
    await page.route('**/api/aadhar/check', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            exists: true,
            user: {
              id: '123',
              fullName: 'Existing User',
              contact: '9876543210',
            },
          },
        }),
      });
    });

    await page.goto('/');

    // Open Aadhar check modal
    await page.getByRole('button', { name: /check.*aadhar/i }).click();

    // Enter existing Aadhar
    await page.getByLabel(/aadhar number/i).fill('123456789012');
    await page.getByRole('button', { name: /check/i }).click();

    // Expect to see existing user information
    await expect(page.getByText('Existing User')).toBeVisible();
    await expect(page.getByText('9876543210')).toBeVisible();
  });
});
