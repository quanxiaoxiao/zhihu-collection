const moment = require('moment');
const db = require('../db');

module.exports = async (after) => {
  const zhiList = db
    .get('zhis')
    .value();

  const list = zhiList
    .filter(item => item.updateCount > 1 && item.updateTime > after.getTime());

  list.forEach((item) => {
    console.log(item.name);
    console.log(item.url);
    console.log(moment(item.updateTime).format('YYYY-MM-DD'));
    console.log('\n');
    console.log('-------------------');
    console.log('\n\n');
  });

  console.log('======================================');
  const questionList = list
    .filter(item => !/zhuanlan/.test(item.url));
  const articleList = list
    .filter(item => /zhuanlan/.test(item.url));
  console.log(`${list.length} updated, question: ${questionList.length}, article: ${articleList.length}`);
};
