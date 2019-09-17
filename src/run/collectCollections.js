const db = require('../db');

module.exports = (list) => {
  list.forEach((item) => {
    let collection = db
      .get('collections')
      .find({
        id: item.id,
      }).value();

    if (!collection) {
      collection = {
        id: item.id,
        name: item.name,
        count: item.count,
        createTime: Date.now(),
      };
      db
        .get('collections')
        .push(collection)
        .write();
    }
    console.log(`collection - name: ${collection.name} count: ${collection.count}`);
  });
};
