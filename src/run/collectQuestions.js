const getQuestion = require('./getQuestion');
const Queue = require('../Queue');
const db = require('../db');

module.exports = () => new Promise(async (resove) => {
  const list = db
    .get('zhis')
    .value()
    .filter(item => !/zhuanlan/.test(item.url));

  const queue = new Queue();

  queue.on('success', async (question) => {
    if (question) {
      const zhi = db
        .get('zhis')
        .find({
          url: question.url,
        })
        .value();
      if (!zhi.content || zhi.content !== question.content) {
        db
          .get('zhis')
          .find({
            url: question.url,
          })
          .assign({
            ...question,
            updateCount: zhi.updateCount ? zhi.updateCount + 1 : 1,
          })
          .write();
      } else if (zhi.upvoteCount !== question.upvoteCount) {
        db
          .get('zhis')
          .find({
            url: question.url,
          })
          .assign({
            upvoteCount: question.upvoteCount,
          })
          .write();
      }
      console.log(`question- name:${zhi.name} url:${zhi.url} upvoteCount:${zhi.upvoteCount}`);
    }
  });

  queue.on('empty', () => {
    setTimeout(() => {
      resove();
    }, 0);
  });

  list
    .forEach((zhiItem) => {
      queue.in(getQuestion, zhiItem);
    });
});
