import {mkdir} from 'node:fs/promises';
import {expect, test} from '@playwright/test';

const REVIEW_DIR = 'artifacts/site-review';

async function catalog(request) {
  const response = await request.get('/data/catalog.json');
  expect(response.ok()).toBeTruthy();
  return response.json();
}

function personalLecture(data) {
  const lecture = data.items.find(item => item.course_id === 'my-notes');
  expect(lecture).toBeTruthy();
  const course = data.courses.find(candidate => candidate.id === lecture.course_id);
  expect(course).toBeTruthy();
  return {lecture, course};
}

test.beforeAll(async () => {
  await mkdir(REVIEW_DIR, {recursive: true});
});

test('catalog contains the personal notes and GAMES001 courses', async ({request}) => {
  const data = await catalog(request);
  expect(data.courses).toHaveLength(2);
  expect(data.courses.map(course => course.id).sort()).toEqual(['games001', 'my-notes']);
  expect(data.items).toHaveLength(18);
  expect(data.items.filter(item => item.course_id === 'my-notes')).toHaveLength(2);
  expect(data.items.filter(item => item.course_id === 'games001')).toHaveLength(16);
  expect(data.items.some(item => /Rubik/i.test(item.title))).toBeTruthy();
  expect(data.papers).toHaveLength(0);
});

test('searches the catalog and opens a course', async ({page, request}, testInfo) => {
  const data = await catalog(request);
  const {lecture, course} = personalLecture(data);

  await page.goto('/index.html');
  await expect(page.getByRole('heading', {name: '课程资料', exact: true})).toBeVisible();
  await expect(page.getByRole('navigation', {name: '主导航'}).getByRole('link', {name: 'GitHub ↗'})).toHaveAttribute(
    'href',
    'https://github.com/wngzwng/lecture-notes',
  );
  await expect(page.getByRole('navigation', {name: '主导航'}).getByRole('link', {name: '论文解读'})).toHaveCount(0);
  await expect(page.getByRole('navigation', {name: '主导航'}).getByRole('link', {name: '提交 PDF'})).toHaveCount(0);
  await page.screenshot({path: `${REVIEW_DIR}/${testInfo.project.name}-home.png`, fullPage: true});

  await page.getByRole('searchbox').fill('Rubik');
  await expect(page.getByText('找到 1 门匹配课程')).toBeVisible();
  await expect(page.locator('#search-lectures .search-lecture-row')).toHaveCount(1);
  await page.getByRole('link', {name: `查看讲义：${course.title}`}).click();
  await expect(page.getByRole('heading', {name: course.title, level: 2})).toBeFocused();
  await expect(page.getByRole('heading', {name: lecture.title})).toBeVisible();
  await page.screenshot({path: `${REVIEW_DIR}/${testInfo.project.name}-course.png`, fullPage: true});
});

test('opens the lecture in HTML and PDF readers', async ({page, request}, testInfo) => {
  const data = await catalog(request);
  const {lecture} = personalLecture(data);
  expect(lecture.web).toBeTruthy();

  await page.goto(`/reader.html?id=${encodeURIComponent(lecture.id)}&format=html`);
  await expect(page.getByRole('heading', {name: lecture.title, level: 1})).toBeVisible();
  await expect(page.locator('.web-document')).toBeVisible();
  const report = await (await request.get('/' + lecture.web.report)).json();
  expect(report.status).toBe('passed');
  await expect(page.locator('.web-document figure')).toHaveCount(report.counts.figures);

  await page.goto(`/reader.html?id=${encodeURIComponent(lecture.id)}&format=pdf`);
  await expect(page.locator('#pdf-viewer canvas').first()).toBeVisible();
  await expect(page.locator('#page-count')).toHaveText(`/ ${lecture.pages}`);
  await expect(page.locator('#open-pdf')).toHaveAttribute('href', lecture.pdf);
  await expect(page.getByRole('link', {name: '下载 PDF'})).toHaveAttribute('download', lecture.pdf.split('/').pop());
  await page.screenshot({path: `${REVIEW_DIR}/${testInfo.project.name}-reader.png`, fullPage: true});
});

test('reader failures offer recovery without inactive PDF actions', async ({page}) => {
  for (const url of ['/reader.html', '/reader.html?id=missing-note']) {
    await page.goto(url);
    await expect(page.getByRole('heading', {name: '无法打开这份讲义'})).toBeVisible();
    await expect(page.locator('.reader-actions')).toBeHidden();
    await expect(page.locator('#reader-course')).toHaveText('阅读暂不可用');
    await page.locator('#reader-error').getByRole('link', {name: '返回课程资料'}).click();
    await expect(page.getByRole('heading', {name: '课程资料', exact: true})).toBeVisible();
  }
});

test('catalog failure can recover and reader failure stops loading', async ({page}) => {
  await page.route('**/data/catalog.json', route => route.fulfill({status: 503, body: 'Unavailable'}));
  await page.goto('/index.html');
  await expect(page.locator('#catalog-error')).toBeVisible();
  await page.unroute('**/data/catalog.json');
  await page.getByRole('button', {name: '重新加载'}).click();
  await expect(page.locator('.course-card').first()).toBeVisible();
  await expect(page.locator('#catalog-error')).toBeHidden();
  await page.route('**/data/catalog.json', route => route.fulfill({status: 503, body: 'Unavailable'}));
  await page.goto('/reader.html?id=unavailable');
  await expect(page.locator('#reader-error')).toBeVisible();
  await expect(page.locator('#reader-course')).toHaveText('阅读暂不可用');
  await expect(page.locator('.reader-actions')).toBeHidden();
});

test('HTML lecture exposes figures, math, and YouTube interval links', async ({page, request}) => {
  const data = await catalog(request);
  const {lecture} = personalLecture(data);
  const report = await (await request.get('/' + lecture.web.report)).json();
  expect(report.status).toBe('passed');
  expect(report.pdf_sha256).toBe(lecture.sha256);
  await page.goto(`/reader.html?id=${lecture.id}&format=html`);
  await expect(page.locator('.web-document')).toBeVisible();
  await expect(page.locator('.web-document figure')).toHaveCount(report.counts.figures);
  await expect(page.locator('.web-document .video-link')).toHaveCount(report.counts.figures);
  await expect(page.locator('.web-document math')).toHaveCount(report.counts.math);
  await expect(page.locator('#reader-error')).toBeHidden();
  const links = await page.locator('.web-document figure').evaluateAll(figures =>
    figures.map(figure => ({time: figure.dataset.start, href: figure.querySelector('.video-link').href}))
  );
  for (const link of links) {
    const expected = new URL(lecture.source_url);
    const [h, m, s] = link.time.split(':').map(Number);
    expected.searchParams.set('t', String(h * 3600 + m * 60 + s));
    expect(link.href).toBe(expected.href);
  }
  await page.locator('.figure-zoom').first().click();
  await expect(page.locator('#figure-dialog')).toBeVisible();
  await page.locator('#close-figure').click();
});

test('PDF zoom changes actual page size through 800 percent and fit width', async ({page, request}) => {
  const {lecture} = personalLecture(await catalog(request));
  await page.goto(`/reader.html?id=${lecture.id}&format=pdf`);
  await expect(page.locator('#pdf-viewer canvas').first()).toBeVisible();
  const paper = page.locator('#pdf-viewer .page').first();
  await page.locator('#pdf-zoom').selectOption('1');
  const w100 = (await paper.boundingBox()).width;
  await page.locator('#pdf-zoom').selectOption('4');
  await expect.poll(async () => (await paper.boundingBox()).width / w100).toBeGreaterThan(3.9);
  await page.locator('#pdf-zoom').selectOption('8');
  await expect.poll(async () => (await paper.boundingBox()).width / w100).toBeGreaterThan(7.9);
  await expect(page.locator('#zoom-in')).toBeDisabled();
  await page.locator('#pdf-zoom').selectOption('page-width');
  await expect.poll(async () => {
    const a = await paper.boundingBox();
    const b = await page.locator('#pdf-container').boundingBox();
    return a.width / b.width;
  }).toBeGreaterThan(.9);
  await expect.poll(async () => {
    const a = await paper.boundingBox();
    const b = await page.locator('#pdf-container').boundingBox();
    return a.width / b.width;
  }).toBeLessThan(1.02);
  await page.locator('#focus-mode').click();
  await expect(page.locator('body')).toHaveClass(/focus-reading/);
  await expect(page.locator('#reader-rail')).toBeHidden();
});

test('PDF page and zoom survive a reload', async ({page, request}) => {
  const {lecture} = personalLecture(await catalog(request));
  await page.goto(`/reader.html?id=${lecture.id}&format=pdf`);
  await expect(page.locator('#pdf-viewer canvas').first()).toBeVisible();
  await page.locator('#pdf-zoom').selectOption('1.5');
  await page.locator('#page-number').fill('4');
  await page.locator('#page-number').press('Tab');
  await page.waitForFunction(sha => JSON.parse(localStorage.getItem(`lecture-reader:v2:${sha}`) || '{}').pdf?.page === 4, lecture.sha256);
  await page.reload();
  await expect(page.locator('#page-number')).toHaveValue('4');
  await expect(page.locator('#pdf-zoom')).toHaveValue('1.5');
});

test('HTML position and typography survive a reload and corrupt HTML offers PDF', async ({page, request}) => {
  const {lecture} = personalLecture(await catalog(request));
  await page.goto(`/reader.html?id=${lecture.id}&format=html`);
  await expect(page.locator('.web-document')).toBeVisible();
  await page.locator('#font-larger').click();
  await page.locator('#chapter-7').scrollIntoViewIfNeeded();
  await page.waitForFunction(sha => !!JSON.parse(localStorage.getItem(`lecture-reader:v2:${sha}`) || '{}').html, lecture.sha256);
  const top = await page.locator('#html-container').evaluate(el => el.scrollTop);
  await page.reload();
  await expect(page.locator('.web-document')).toBeVisible();
  await expect.poll(() => page.locator('#html-container').evaluate(el => el.scrollTop)).toBeGreaterThan(top - 150);
  expect(await page.locator('body').evaluate(el => getComputedStyle(el).getPropertyValue('--reading-font-size'))).toBe('21px');
  await page.route('**/notes/**/article.html', r => r.fulfill({status: 200, contentType: 'text/html', body: '<article>corrupt</article>'}));
  await page.reload();
  await expect(page.locator('#fallback-pdf')).toBeVisible();
  await page.locator('#fallback-pdf').click();
  await expect(page.locator('#pdf-viewer canvas').first()).toBeVisible();
});

test('PDF search uses the text layer and finds Chinese text', async ({page, request}) => {
  const {lecture} = personalLecture(await catalog(request));
  await page.goto(`/reader.html?id=${lecture.id}&format=pdf`);
  await expect(page.locator('#pdf-viewer .textLayer').first()).toBeVisible();
  await page.locator('.pdf-search summary').click();
  await page.locator('#pdf-search').fill('魔方');
  await expect.poll(async () => Number((await page.locator('#find-count').innerText()).split('/')[1])).toBeGreaterThan(0);
});
