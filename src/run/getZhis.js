const cheerio = require('cheerio');
const request = require('../request');

module.exports = async (collection) => {
  try {
    const buf = await request.get(`https://www.zhihu.com/collection/${collection.id}?page=${collection.page}`);
    const $ = cheerio.load(buf.toString());
    const children = $('#zh-list-collection-wrap').children();
    return children.map((i, child) => {
      const $child = $(child);
      const $a = $(child).find(':first-child a').eq(0);
      if ($child.attr('data-type') === 'Post') {
        const href = $a.attr('href');
        return {
          name: $a.text(),
          url: href,
          collection,
        };
      }
      return {
        name: $a.text(),
        url: `https://www.zhihu.com${$child.find('link[itemprop=url]').eq(0).attr('href')}`,
        collection,
      };
    }).get();
  } catch (error) {
    return [];
  }
};
