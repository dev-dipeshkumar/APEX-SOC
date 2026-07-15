import { chromium } from 'playwright';
import path from 'path';

const SCREENSHOTS_DIR = path.resolve('/home/z/my-project/docs/images');
const BASE_URL = 'http://localhost:3000';

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // 1. Login Screen
  console.log('Capturing login screen...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'screenshots', 'login.png'),
    fullPage: false,
  });
  console.log('  ✓ login.png');

  // 2. Log in
  console.log('Logging in...');
  await page.fill('input[type="text"], input[placeholder*="Username"], input[id*="user"]', 'admin').catch(() => {});
  await page.fill('input[type="password"], input[placeholder*="Password"], input[id*="pass"]', 'apex-admin-2024').catch(() => {});
  
  const loginBtn = await page.$('button:has-text("Login"), button:has-text("Sign"), button[type="submit"]');
  if (loginBtn) {
    await loginBtn.click();
    await page.waitForTimeout(3000);
  } else {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);
  }
  console.log('  Logged in');

  // 3. Dashboard
  console.log('Capturing dashboard...');
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'screenshots', 'dashboard.png'),
    fullPage: false,
  });
  console.log('  ✓ dashboard.png');

  // 4. Alerts View
  console.log('Capturing alerts view...');
  const alertsBtn = await page.$('button:has-text("Alerts"), [data-view="alerts"]');
  if (alertsBtn) {
    await alertsBtn.click();
    await page.waitForTimeout(2000);
  } else {
    await page.keyboard.press('2');
    await page.waitForTimeout(2000);
  }
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'screenshots', 'alerts.png'),
    fullPage: false,
  });
  console.log('  ✓ alerts.png');

  // 5. Intel Map
  console.log('Capturing intel map...');
  const intelBtn = await page.$('button:has-text("Intel"), [data-view="intel-map"]');
  if (intelBtn) {
    await intelBtn.click();
    await page.waitForTimeout(4000);
  } else {
    await page.keyboard.press('3');
    await page.waitForTimeout(4000);
  }
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'screenshots', 'intel-map.png'),
    fullPage: false,
  });
  console.log('  ✓ intel-map.png');

  // 6. Assets View
  console.log('Capturing assets view...');
  const assetsBtn = await page.$('button:has-text("Assets"), [data-view="assets"]');
  if (assetsBtn) {
    await assetsBtn.click();
    await page.waitForTimeout(2000);
  } else {
    await page.keyboard.press('4');
    await page.waitForTimeout(2000);
  }
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'screenshots', 'assets.png'),
    fullPage: false,
  });
  console.log('  ✓ assets.png');

  // 7. Settings View
  console.log('Capturing settings view...');
  const settingsBtn = await page.$('button:has-text("Settings"), [data-view="settings"]');
  if (settingsBtn) {
    await settingsBtn.click();
    await page.waitForTimeout(2000);
  } else {
    await page.keyboard.press('5');
    await page.waitForTimeout(2000);
  }
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'screenshots', 'settings.png'),
    fullPage: false,
  });
  console.log('  ✓ settings.png');

  // 8. Topology
  console.log('Capturing network topology...');
  await page.keyboard.press('4');
  await page.waitForTimeout(1000);
  const topoBtn = await page.$('button:has-text("Topology"), button:has-text("Network")');
  if (topoBtn) {
    await topoBtn.click();
    await page.waitForTimeout(2000);
  }
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'screenshots', 'topology.png'),
    fullPage: false,
  });
  console.log('  ✓ topology.png');

  // 9. Banner - panoramic from dashboard
  console.log('Capturing banner...');
  await page.keyboard.press('1');
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'banner.png'),
    fullPage: false,
    clip: { x: 0, y: 0, width: 1440, height: 640 },
  });
  console.log('  ✓ banner.png');

  await browser.close();
  console.log('\nAll screenshots captured successfully!');
}

takeScreenshots().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
