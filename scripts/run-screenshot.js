#!/usr/bin/env node

const { execSync } = require('child_process');

const script = `
const { chromium } = require('playwright-core');
const COURSE_ID = '2fe47bf3-9cb0-4756-8e62-2c3895c5d3bb';
const LESSON_ID = 'd239daeb-f7e9-410e-84c7-8f0eac3ebcb4';
const CHROMIUM_PATH = '/home/sergey/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM_PATH });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/lessons/' + LESSON_ID + '?course=' + COURSE_ID, { waitUntil: 'networkidle' });
  await page.evaluate(() => { localStorage.setItem('chess-direction', 'c'); });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('[data-square]', { timeout: 10000 });
  await page.waitForTimeout(2000);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/home/sergey/sergey-hq/screenshots/heirloom-lesson1-desktop.png', fullPage: false });
  console.log('Saved: heirloom-lesson1-desktop.png');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/home/sergey/sergey-hq/screenshots/heirloom-lesson1-mobile.png', fullPage: false });
  console.log('Saved: heirloom-lesson1-mobile.png');

  await browser.close();
})();
`;

execSync('npx playwright-core@1.61.1 -e "' + script.replace(/"/g, '\\"') + '"', {
  cwd: '/home/sergey/sergey-hq/chess-course-platform-designer',
  stdio: 'inherit',
});
