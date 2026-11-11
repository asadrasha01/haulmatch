import { test, expect } from '@playwright/test';

test.describe('Driver Application & Fast-Track Onboarding Flow', () => {
  test('persists draft to localStorage and restores on reload', async ({ page }) => {
    await page.goto('/');

    const nameInput = page.getByPlaceholderText(/Marcus Vance/i);
    await nameInput.fill('Devon Ray');

    // Reload page
    await page.reload();

    // Draft restore banner should appear
    await expect(page.getByText(/APPLICATION DRAFT RESTORED/i)).toBeVisible();
    await expect(page.getByPlaceholderText(/Marcus Vance/i)).toHaveValue('Devon Ray');
  });

  test('opens driver status portal and performs magic link lookup', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /Check Application Status/i }).click();
    await expect(page.getByText(/DRIVER APPLICATION STATUS LOOKUP/i)).toBeVisible();

    const emailInput = page.getByPlaceholderText(/marcus\.vance\.cdl@gmail\.com/i);
    await emailInput.fill('marcus.vance.cdl@gmail.com');
    await page.getByRole('button', { name: /Look Up Status/i }).click();

    await expect(page.getByText(/APPLICATION ACTIVE & APPROVED/i)).toBeVisible();
    await expect(page.getByText(/CDL-8421/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Email Access Link/i })).toBeVisible();
  });
});
