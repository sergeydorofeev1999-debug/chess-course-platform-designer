const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME = require('chromium').path;
const URL = 'https://chess-course-platform-designer.vercel.app';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  // Desktop 1440
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto(URL + '/courses', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(3000);
  await page.screenshot({ path: '/tmp/courses-desktop.png', fullPage: false });
  console.log('saved /tmp/courses-desktop.png');

  // Mobile 375
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
  await page.goto(URL + '/courses', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(3000);
  await page.screenshot({ path: '/tmp/courses-mobile.png', fullPage: false });
  console.log('saved /tmp/courses-mobile.png');

  await browser.close();
})();
