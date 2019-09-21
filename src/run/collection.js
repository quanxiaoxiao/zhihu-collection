const db = require('../db');
const getZhuanLan = require('./getZhuanLan');
const getQuestion = require('./getQuestion');
const Queue = require('../Queue');

module.exports = () => new Promise(async (resolve) => {
  const list = db
    .get('zhis')
    .value();
  const queue = new Queue();

  queue.on('success', async (item) => {
    if (item) {
      const zhi = db
        .get('zhis')
        .find({
          url: item.url,
        })
        .value();
      if (!zhi.content || zhi.content !== item.content) {
        db
          .get('zhis')
          .find({
            url: item.url,
          })
          .assign({
            ...item,
            updateCount: zhi.updateCount ? zhi.updateCount + 1 : 1,
          })
          .write();
      } else if (zhi.upvoteCount !== item.upvoteCount) {
        db
          .get('zhis')
          .find({
            url: item.url,
          })
          .assign({
            upvoteCount: item.upvoteCount,
          })
          .write();
      }
      console.log(`${/zhuanlan/.test(zhi.url) ? 'zhuanlan' : 'question'} - name:${zhi.name} url:${zhi.url} upvoteCount:${zhi.upvoteCount}`);
    }
  });

  queue.on('empty', () => {
    setTimeout(() => {
      resolve();
    }, 0);
  });

  list
    .forEach((item) => {
      if (/zhuanlan/.test(item.url)) {
        queue.in(getZhuanLan, item);
      } else {
        queue.in(getQuestion, item);
      }
    });
});
