const { chromium } = require('playwright-core');

const COURSE_ID = '2fe47bf3-9cb0-4756-8e62-2c3895c5d3bb';
const LESSON_ID = 'd239daeb-f7e9-410e-84c7-8f0eac3ebcb4';

const directions = ['a', 'b', 'c', 'd'];
const dirNames = { a: 'A-Apple', b: 'B-Nintendo', c: 'C-Luxury', d: 'D-Digital' };

async function screenshotPage(page, dir, path, waitFor) {
  await page.evaluate((d) => { localStorage.setItem('chess-direction', d); }, dir);
  await page.reload({ waitUntil: 'networkidle' });
  if (waitFor) {
    try { await page.waitForSelector(waitFor, { timeout: 5000 }); } catch {}
  }
  await page.screenshot({ path, fullPage: false });
  console.log(`Saved: ${path}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  const dirPath = '/home/sergey/sergey-hq/chess-course-platform-designer/public/screenshots';

  for (const dir of directions) {
    const name = dirNames[dir];

    // 1. Home page
    await page.goto(`http://localhost:3000/`, { waitUntil: 'networkidle' });
    await screenshotPage(page, dir, `${dirPath}/home-${name}.png`, 'section');

    // 2. Courses page
    await page.goto(`http://localhost:3000/courses`, { waitUntil: 'networkidle' });
    await screenshotPage(page, dir, `${dirPath}/courses-${name}.png`, 'h1');

    // 3. Course detail (piece cards)
    await page.goto(`http://localhost:3000/courses/${COURSE_ID}`, { waitUntil: 'networkidle' });
    await screenshotPage(page, dir, `${dirPath}/course-detail-${name}.png`, 'h1');

    // 4. Lesson page (board + stars)
    await page.goto(`http://localhost:3000/lessons/${LESSON_ID}?course=${COURSE_ID}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshotPage(page, dir, `${dirPath}/lesson-${name}.png`, '[data-square]');

    // 5. Dashboard
    await page.goto(`http://localhost:3000/dashboard`, { waitUntil: 'networkidle' });
    await screenshotPage(page, dir, `${dirPath}/dashboard-${name}.png`, 'h1');
  }

  // Preview page
  await page.goto(`http://localhost:3000/preview`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${dirPath}/preview-all.png`, fullPage: true });
  console.log('Saved: preview-all.png');

  await browser.close();
  console.log('All screenshots done!');
})();
