const https = require('https');
const { parse } = require('url');
const config = require('./config');


exports.get = (url, options = {}) => new Promise((resolve, reject) => {
  const headers = {
    cookie: config.cookie,
    referer: 'https://www.zhihu.com/',
    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/76.0.3809.100 Chrome/76.0.3809.100 Safari/537.36',
  };

  const {
    path,
    hostname,
  } = parse(url);
  const req = https.get({
    method: 'GET',
    hostname,
    path,
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });
  req.on('response', (res) => {
    if (res.statusCode !== 200) {
      reject();
    } else {
      const buf = [];
      res.on('data', (chunk) => {
        buf.push(chunk);
      });
      res.on('end', () => {
        resolve(Buffer.concat(buf));
      });
    }
  });
  req.end();
});
