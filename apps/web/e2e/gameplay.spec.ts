import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'Mobile Small (Android 360x640)', width: 360, height: 640 },
  { name: 'Mobile Large (iPhone 390x844)', width: 390, height: 844 },
];

for (const vp of VIEWPORTS) {
  test.describe(`Warri Vibe Core Gameplay Loop - ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('Loads game screen and renders core status bar and actions', async ({ page }) => {
      await page.goto('/');

      // Status bar assertions
      await expect(page.locator('text=Day 1')).toBeVisible();
      await expect(page.locator('text=₦5,000')).toBeVisible();

      // Action card assertions
      const freelanceBtn = page.locator('#btn-do-freelance_gig');
      await expect(freelanceBtn).toBeVisible();

      // Perform Freelance gig
      await freelanceBtn.click();
      await expect(page.locator('text=Activity Ticker')).toBeVisible();

      // Eat food
      const eatBtn = page.locator('button:has-text("Chop (₦500)")');
      await expect(eatBtn).toBeVisible();
      await eatBtn.click();

      // Travel to Effurun
      await page.locator('#nav-map').click();
      await page.locator('text=Effurun Roundabout').click();
      await page.locator('#btn-travel-keke').click();
      await expect(page.locator('text=Effurun Roundabout')).toBeVisible();

      // End Day 1 and verify Day Summary modal
      await page.locator('button:has-text("Sleep / End Day")').click();
      await expect(page.locator('text=Day 1 Summary')).toBeVisible();

      // Start Day 2
      await page.locator('#btn-start-next-day').click();
      await expect(page.locator('text=Day 2')).toBeVisible();

      // Play Day 2 and Day 3
      await page.locator('button:has-text("Sleep / End Day")').click();
      await page.locator('#btn-start-next-day').click();
      await expect(page.locator('text=Day 3')).toBeVisible();

      // Open Settings and check Export Save
      await page.locator('#nav-settings').click();
      await expect(page.locator('text=Backup & Transfer Save')).toBeVisible();
    });
  });
}
