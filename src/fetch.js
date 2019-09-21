const path = require('path');
const open = require('open');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const os = require('os');
// const terminalImage = require('terminal-image');
const _ = require('lodash');
const db = require('./db');
const collectCollections = require('./run/collectCollections');
const collectZhis = require('./run/collectZhis');
const collection = require('./run/collection');

const request = require('./request');
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

  page.on('request', (req) => {
    const headers = {
      ..._.omit(req.headers(), [
        'x-zse-83',
      ]),
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/76.0.3809.100 Chrome/76.0.3809.100 Safari/537.36',
    };

    req.continue({ headers });
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
  const cookies = await page.cookies();
  const cookieStr = cookies.map(item => `${item.name}=${item.value}`).join('; ');
  config.cookie = cookieStr;
  await browser.close();
  const buf = await request.get(`https://www.zhihu.com/people/${token}/collections?page=1`);
  const $ = cheerio.load(buf.toString());
  const $script = $('#js-initialData');
  if ($script.length === 0) {
    process.exit(1);
  }
  const { initialState } = JSON.parse($script.get()[0].children[0].data);
  const collections = initialState.entities.favlists;
  const list = Object.entries(collections)
    .map(([, value]) => ({
      name: value.title,
      id: `${value.id}`,
      count: value.answerCount,
    }));
  const $paginations = $('.Pagination > button');
  if ($paginations.length > 2) {
    const $last = $paginations.eq($paginations.length - 2);
    const totalPage = parseInt($last.text(), 10);

    await [...Array(totalPage)]
      .map((d, i) => i)
      .slice(1)
      .map(n => `https://www.zhihu.com/api/v4/members/shan-ren-88/favlists?include=data%5B*%5D.updated_time%2Canswer_count%2Cfollower_count%2Cis_public&offset=${n * 20}&limit=20`)
      .reduce(async (acc, cur) => {
        await acc;
        const ret = await request.get(cur);
        const { data } = JSON.parse(ret.toString());
        list.push(...data.map(item => ({
          name: item.title,
          id: `${item.id}`,
          count: item.answer_count,
        })));
      }, Promise.resolve);
  }
  await collectCollections(list);
  await collectZhis();
  await collection();
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
