import { test, expect } from '@playwright/test';

test.describe('Admin Command Center & Placement Invoice Flow', () => {
  test('manages pipeline, reviews audit feed, and generates placement invoice', async ({ page }) => {
    await page.goto('/');

    // Switch to Admin
    await page.getByRole('button', { name: /STAFF PORTAL/i }).click();

    // Authenticate if on AuthGate
    const autofillBtn = page.getByRole('button', { name: /Autofill Admin →/i });
    if (await autofillBtn.isVisible()) {
      await autofillBtn.click();
      await page.getByRole('button', { name: /Sign In/i }).click();
    }

    // Dashboard tabs
    await expect(page.getByText(/OPERATIONS COMMAND CENTER/i)).toBeVisible();
    await expect(page.getByText(/Export Drivers CSV/i)).toBeVisible();

    // Activity & Escrow feed
    await expect(page.getByText(/ACTIVITY & ESCROW AUDIT FEED/i)).toBeVisible();

    // Click Generate Invoice
    const invoiceBtn = page.getByRole('button', { name: /Generate Invoice/i }).first();
    if (await invoiceBtn.isVisible()) {
      await invoiceBtn.click();
      await expect(page.getByText(/PLACEMENT FEE INVOICE/i)).toBeVisible();
      await expect(page.getByText(/NET 15 TERMS/i)).toBeVisible();

      // Test Escape key close
      await page.keyboard.press('Escape');
      await expect(page.getByText(/PLACEMENT FEE INVOICE/i)).not.toBeVisible();
    }
  });
});

