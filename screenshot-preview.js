const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME = '/home/sergey/sergey-hq/chess-course-platform-designer/node_modules/chromium/lib/chromium/chrome-linux/chrome';
const URL = 'https://chess-course-platform-designer.vercel.app';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  // Mobile
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
  await page.goto(URL + '/preview', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  const mobileFile = path.resolve('/tmp/preview-mobile-375.png');
  await page.screenshot({ path: mobileFile, fullPage: false });
  console.log('saved', mobileFile);

  // Desktop
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto(URL + '/preview', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  const desktopFile = path.resolve('/tmp/preview-desktop-1440.png');
  await page.screenshot({ path: desktopFile, fullPage: false });
  console.log('saved', desktopFile);

  await browser.close();
})();
