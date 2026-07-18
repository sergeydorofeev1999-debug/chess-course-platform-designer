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

  // ========== DESKTOP 1440 ==========
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto(URL + '/courses', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(2000);
  const courseLink = await page.$('a[href^="/courses/"]');
  if (courseLink) {
    await courseLink.click();
    await sleep(3000);
  }
  // Ищем ссылку на урок (может быть /lessons/...)
  let lessonLink = await page.$('a[href^="/lessons/"]');
  if (!lessonLink) {
    // Пробуем другие селекторы
    lessonLink = await page.$('a[href*="/lessons/"]');
  }
  if (lessonLink) {
    await lessonLink.click();
    await sleep(5000);
  }
  await page.screenshot({ path: '/tmp/lesson-desktop-1440.png', fullPage: false });
  console.log('saved /tmp/lesson-desktop-1440.png');

  // ========== DESKTOP 1024 ==========
  await page.setViewport({ width: 1024, height: 768, deviceScaleFactor: 2 });
  await page.reload({ waitUntil: 'networkidle2' });
  await sleep(4000);
  await page.screenshot({ path: '/tmp/lesson-desktop-1024.png', fullPage: false });
  console.log('saved /tmp/lesson-desktop-1024.png');

  // ========== MOBILE 375 ==========
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
  await page.reload({ waitUntil: 'networkidle2' });
  await sleep(4000);
  await page.screenshot({ path: '/tmp/lesson-mobile-375.png', fullPage: false });
  console.log('saved /tmp/lesson-mobile-375.png');

  // ========== MOBILE 390 ==========
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.reload({ waitUntil: 'networkidle2' });
  await sleep(4000);
  await page.screenshot({ path: '/tmp/lesson-mobile-390.png', fullPage: false });
  console.log('saved /tmp/lesson-mobile-390.png');

  // ========== MOBILE 414 ==========
  await page.setViewport({ width: 414, height: 896, deviceScaleFactor: 2 });
  await page.reload({ waitUntil: 'networkidle2' });
  await sleep(4000);
  await page.screenshot({ path: '/tmp/lesson-mobile-414.png', fullPage: false });
  console.log('saved /tmp/lesson-mobile-414.png');

  await browser.close();
})();
