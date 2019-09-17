const _ = require('lodash');
const cheerio = require('cheerio');
const request = require('../request');

module.exports = async (zhi) => {
  const buf = await request.get(zhi.url);
  const $ = cheerio.load(buf.toString());
  const $script = $('#js-initialData');
  if ($script.length === 0) {
    return null;
  }
  const { initialState } = JSON.parse($script.get()[0].children[0].data);
  const id = zhi.url.match(/\/p\/(\d+)\b/)[1];
  const article = _.get(initialState, `entities.articles.${id}`);
  if (!article) {
    return null;
  }
  const content = cheerio.load(article.content).text();
  return {
    ...zhi,
    content,
    upvoteCount: article.voteupCount,
    updateTime: article.updated * 1000,
  };
};
