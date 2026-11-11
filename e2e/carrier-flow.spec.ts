import { test, expect } from '@playwright/test';

test.describe('Carrier ATS & Candidate Unlock Flow', () => {
  test('authenticates carrier and executes contingency contract unlock', async ({ page }) => {
    await page.goto('/');

    // Switch to Carrier view
    await page.getByRole('button', { name: /CARRIER ATS/i }).click();

    // Check if in AuthGate
    const demoBtn = page.getByRole('button', { name: /Carrier ATS Demo →/i });
    if (await demoBtn.isVisible()) {
      await demoBtn.click();
    }

    // Candidate marketplace should render
    await expect(page.getByText(/Pre-Screened CDL Marketplace/i)).toBeVisible();

    // Click Unlock Candidate
    const unlockButtons = page.getByRole('button', { name: /Unlock Candidate/i });
    await expect(unlockButtons.first()).toBeVisible();
    await unlockButtons.first().click();

    // Contingency Placement Agreement modal opens
    await expect(page.getByText(/Contingency Placement Agreement/i)).toBeVisible();
    await expect(page.getByText(/50% upfront at candidate unmasking/i)).toBeVisible();

    // E-Sign
    await page.getByRole('button', { name: /E-Sign & Unlock Candidate Contact/i }).click();

    // Advances to Interview Proposer step
    await expect(page.getByText(/Candidate Contact Unlocked & Interview Proposer/i)).toBeVisible();
  });
});

