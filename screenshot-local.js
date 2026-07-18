const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME = '/home/sergey/sergey-hq/chess-course-platform-designer/node_modules/chromium/lib/chromium/chrome-linux/chrome';
const URL = 'http://localhost:3000';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
  await page.goto(URL + '/preview', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 5000));

  const file = path.resolve('/tmp/preview-mobile-375.png');
  await page.screenshot({ path: file, fullPage: false });
  console.log('saved', file);

  await browser.close();
})();
