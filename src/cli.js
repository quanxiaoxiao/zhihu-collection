const fs = require('fs');
const yargs = require('yargs');
const moment = require('moment');
const pkg = require('../package.json');
const searchByKeywords = require('./queries/searchByKeywords');
const updated = require('./queries/updated');
const fetch = require('./fetch');
const config = require('./config');

try {
  const stat = fs.statSync(config.dir);
  if (!stat.isDirectory()) {
    throw new Error();
  }
} catch (error) {
  fs.mkdirSync(config.dir);
}


yargs // eslint-disable-line
  .command(
    'fetch',
    'fetch zhihu collections data',
    () => ({}),
    () => {
      fetch();
    },
  )
  .command(
    'search',
    'search by keywords',
    () => ({}),
    (argv) => {
      const keywords = argv._[1];
      if (keywords == null) {
        process.exit(1);
      }
      searchByKeywords(keywords);
    },
  )
  .command(
    'updated',
    'updated after date(YYYY-MM-DD)',
    () => ({}),
    (argv) => {
      const date = argv._[1];
      const m = moment(date, 'YYYY-MM-DD', true);
      if (m.isValid()) {
        updated(m.toDate());
      }
    },
  )
  .version(pkg.version)
  .alias('version', 'v')
  .argv;
