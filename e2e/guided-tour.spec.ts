import { test, expect } from '@playwright/test';

test.describe('HaulMatch Guided Product Tour (3-Min Marketplace Walkthrough)', () => {
  test('launches via query parameter and walks through all 4 marketplace lifecycle steps', async ({ page }) => {
    await page.goto('/?tour=true');

    // 1. Tour Bar should be visible
    const tourBar = page.getByRole('region', { name: /Guided Tour/i });
    await expect(tourBar).toBeVisible();

    // Verify Step 1 is active
    await expect(page.getByText(/STEP 1 \/\/ DRIVER APPLICATION/i)).toBeVisible();
    await expect(page.getByText(/Driver Application & Screening/i)).toBeVisible();

    // Advance to Step 2
    await page.getByRole('button', { name: /Next Step →/i }).click();
    await expect(page.getByText(/STEP 2 \/\/ CARRIER ATS/i)).toBeVisible();
    await expect(page.getByText(/Carrier Blind ATS/i)).toBeVisible();

    // Advance to Step 3
    await page.getByRole('button', { name: /Next Step →/i }).click();
    await expect(page.getByText(/STEP 3 \/\/ DRIVER CABIN/i)).toBeVisible();
    await expect(page.getByText(/Driver Cabin & Offer Room/i)).toBeVisible();

    // Advance to Step 4
    await page.getByRole('button', { name: /Next Step →/i }).click();
    await expect(page.getByText(/STEP 4 \/\/ ADMIN & ESCROW/i)).toBeVisible();
    await expect(page.getByText(/Admin Command & Escrow Sentinel/i)).toBeVisible();

    // Toggle Commercial Economics Breakdown
    await page.getByRole('button', { name: /Commercial Economics/i }).click();
    await expect(page.getByText(/Placement Fee: \$4,500/i)).toBeVisible();
    await expect(page.getByText(/Driver Retention Bonus: \$1,500/i)).toBeVisible();
  });
});
