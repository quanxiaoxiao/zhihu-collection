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
  const id = zhi.url.match(/\/answer\/(\d+)\b/)[1];
  const answer = _.get(initialState, `entities.answers.${id}`);
  if (_.isEmpty(answer)) {
    return null;
  }
  const content = cheerio.load(answer.content).text();
  return {
    ...zhi,
    content,
    upvoteCount: answer.voteupCount,
    updateTime: answer.updatedTime * 1000,
  };
};
