import { test, expect } from '@playwright/test';

test.describe('Driver Cabin & Offer Negotiation Flow', () => {
  test('renders driver compensation package, escrow status, and accepts interview slot', async ({ page }) => {
    await page.goto('/?portal=cabin');

    // Cabin Header
    await expect(page.getByText(/DRIVER OPERATIONS CABIN/i)).toBeVisible();
    await expect(page.getByText(/\$1,500 ESCROW SECURED/i)).toBeVisible();
    await expect(page.getByText(/BLIND CANDIDATE MODE/i)).toBeVisible();

    // Verify Pending Carrier Offers
    await expect(page.getByText(/Swiftline Global Logistics LLC/i)).toBeVisible();
    await expect(page.getByText(/\$0\.80 \/ MILE/i)).toBeVisible();

    // Accept interview slot
    const acceptSlotBtn = page.getByRole('button', { name: /Accept This Slot & Confirm Interview/i });
    if (await acceptSlotBtn.isVisible()) {
      await acceptSlotBtn.click();
      await expect(page.getByText(/CONFIRMED/i)).toBeVisible();
    }
  });
});
