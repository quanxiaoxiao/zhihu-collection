const path = require('path');
const open = require('open');
const puppeteer = require('puppeteer');
const os = require('os');
// const terminalImage = require('terminal-image');
const _ = require('lodash');
const db = require('./db');
const collectCollections = require('./run/collectCollections');
const collectZhis = require('./run/collectZhis');
const collectQuestions = require('./run/collectQuestions');
const collectZhuanLan = require('./run/collectZhuanLan');
const config = require('./config');

const qrcodeImagePathname = path.resolve(os.tmpdir(), '11111111111111111111111111111111111.png');

module.exports = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({
    width: 1800,
    height: 1200,
  });
  await page.setRequestInterception(true);

  /*
  page.on('response', async (res) => {
    const url = res.url();
    if (/\/login\/qrcode\/[^/]+\/image/.test(url)) {
      const buf = await res.buffer();
      console.log(await terminalImage.buffer(buf));
    }
  });
  */

  page.on('request', (request) => {
    const headers = {
      ..._.omit(request.headers(), [
        'x-zse-83',
      ]),
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/76.0.3809.100 Chrome/76.0.3809.100 Safari/537.36',
    };

    request.continue({ headers });
  });

  await page.goto('https://www.zhihu.com/signin');
  await page.waitFor(() => document.querySelector('#root > div > main > div > div > div.Card.SignContainer-content > div > form > div.SignFlow-tabs > div.SignFlow-qrcodeTab'));
  await page.click('#root > div > main > div > div > div.Card.SignContainer-content > div > form > div.SignFlow-tabs > div.SignFlow-qrcodeTab');
  await page.waitForResponse((response) => {
    const url = response.url();
    return /\/login\/qrcode\/[^/]+\/image/.test(url);
  });

  const $image = await page.$('#root > div > main > div > div > div.Card.SignContainer-content > div > div.Qrcode-container.SignInQrcode');
  await $image.screenshot({
    path: qrcodeImagePathname,
  });
  open(qrcodeImagePathname);
  const meResponse = await page.waitForResponse((response) => {
    const url = response.url();
    return /\/api\/v4\/me\b/.test(url);
  });
  console.log('login success');
  console.time('爬取耗时');
  const { url_token: token } = await meResponse.json();
  page.goto(`https://www.zhihu.com/people/${token}/collections?page=1`);
  const collectionResponse = await page.waitForResponse((response) => {
    const url = response.url();
    return /\/favlists\?/.test(url);
  });
  const data = await collectionResponse.json();
  const dataList = data
    .data
    .map(item => ({
      name: item.title,
      id: item.url.match(/(?<=\/)\d+$/)[0],
      count: item.answer_count,
    }));
  await page.waitFor(() => !!document.querySelector('#Profile-collections > div:nth-child(2) > .List-item'));
  const list = await page.evaluate(() => {
    const arr = document.querySelectorAll('#Profile-collections > div:nth-child(2) > .List-item');
    return [...arr].map((item) => {
      const elem = item.querySelector('div > h2 > div > a');
      const count = item
        .querySelector('.ContentItem-meta .ContentItem-status span:nth-child(2)')
        .innerText
        .match(/^\d+/)[0];
      return {
        name: elem.innerText,
        id: elem.getAttribute('href').match(/(?<=\/)\d+$/)[0],
        count: parseInt(count, 10),
      };
    });
  });
  const cookies = await page.cookies();
  const cookieStr = cookies.map(item => `${item.name}=${item.value}`).join('; ');
  config.cookie = cookieStr;
  await collectCollections([...list, ...dataList]);
  await collectZhis();
  await collectZhuanLan();
  await collectQuestions();
  const zhiList = db.get('zhis').value();
  const len = zhiList.length;
  let articleCount = 0;
  let questionCount = 0;
  for (let i = 0; i < len; i++) {
    const item = zhiList[i];
    if (/zhuanlan/.test(item.url)) {
      articleCount++;
    } else {
      questionCount++;
    }
  }
  console.timeEnd('爬取耗时');
  console.log(`total: ${zhiList.length}, question: ${questionCount}, article: ${articleCount}`);
  process.exit(0);
};
