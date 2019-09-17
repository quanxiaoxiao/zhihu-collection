const getZhis = require('./getZhis');
const Queue = require('../Queue');
const db = require('../db');

const PAGE_SIZE = 10;

module.exports = () => new Promise((resolve) => {
  const collectionList = db.get('collections').value();

  const queue = new Queue();

  queue.on('success', (zhiList) => {
    zhiList.forEach((zhiItem) => {
      const zhi = db
        .get('zhis')
        .find({
          url: zhiItem.url,
        })
        .value();
      if (!zhi) {
        const { collection } = zhiItem;
        db
          .get('zhis')
          .push({
            name: zhiItem.name,
            url: zhiItem.url,
            collection: collection.id,
          })
          .write();
      }
      console.log(`zhi - name: ${zhiItem.name} url: ${zhiItem.url} collection: ${zhiItem.collection.name}`);
    });
  });

  queue.on('empty', () => {
    setTimeout(() => {
      resolve();
    }, 0);
  });

  collectionList
    .map((collectionItem) => {
      const size = Math.floor(collectionItem.count / PAGE_SIZE);
      const reqList = [];
      for (let i = 0; i <= size; i++) {
        reqList.push({
          name: collectionItem.name,
          id: collectionItem.id,
          page: i + 1,
        });
      }
      return reqList;
    })
    .reduce((acc, cur) => [...acc, ...cur], [])
    .forEach((item) => {
      queue.in(getZhis, item);
    });
});
