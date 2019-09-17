const db = require('../db');
const getZhuanLan = require('./getZhuanLan');
const Queue = require('../Queue');

module.exports = () => new Promise(async (resolve) => {
  const list = db
    .get('zhis')
    .value()
    .filter(item => /zhuanlan/.test(item.url));

  const queue = new Queue();

  queue.on('success', async (zhuanlan) => {
    if (zhuanlan) {
      const zhi = db
        .get('zhis')
        .find({
          url: zhuanlan.url,
        })
        .value();
      if (!zhi.content || zhi.content !== zhuanlan.content) {
        db
          .get('zhis')
          .find({
            url: zhuanlan.url,
          })
          .assign({
            ...zhuanlan,
            updateCount: zhi.updateCount ? zhi.updateCount + 1 : 1,
          })
          .write();
      } else if (zhi.upvoteCount !== zhuanlan.upvoteCount) {
        db
          .get('zhis')
          .find({
            url: zhuanlan.url,
          })
          .assign({
            upvoteCount: zhuanlan.upvoteCount,
          })
          .write();
      }
      console.log(`zhuanlan- name:${zhi.name} url:${zhi.url} upvoteCount:${zhi.upvoteCount}`);
    }
  });

  queue.on('empty', () => {
    setTimeout(() => {
      resolve();
    }, 0);
  });

  list
    .forEach((zhiItem) => {
      queue.in(getZhuanLan, zhiItem);
    });
});
