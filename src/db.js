const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const config = require('./config');

const adapter = new FileSync(path.resolve(config.dir, 'db.json'));


const db = low(adapter);

db.defaults({
  collections: [],
  zhis: [],
}).write();

module.exports = db;
