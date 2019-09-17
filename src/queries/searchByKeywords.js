const db = require('../db');

module.exports = (keywords) => {
  const reg = new RegExp(keywords, 'i');
  const zhiList = db
    .get('zhis')
    .value();
  const list = zhiList
    .filter(item => reg.test(item.name) || reg.test(item.content));

  const str = list
    .map(item => [
      item.name,
      item.url,
      item.upvoteCount,
      '----------------------------------------------------------------------------',
      '\n',
      item.content,
      '\n',
    ].join('\n')).join('=============================================================================\n\n\n');
  console.log(str);
  const questionList = list
    .filter(item => !/zhuanlan/.test(item.url));
  const articleList = list
    .filter(item => /zhuanlan/.test(item.url));
  console.log(`total: ${list.length}, question: ${questionList.length}, article: ${articleList.length}`);
};
