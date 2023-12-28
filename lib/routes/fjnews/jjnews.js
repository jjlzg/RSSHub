const got = require('@/utils/got');
const cheerio = require('cheerio');
const url = require('url');
let host = 'https://local.cctv.com/jiangxi';
let citytitle = '九江新闻';

module.exports = async (ctx) => {

   // 限制为25时转到江西新闻
 if (ctx.params.limit === '25') {
      host = 'https://local.cctv.com/jiangxi';
      citytitle = '江西新闻';
    } else {
      host = 'https://local.cctv.com/jiangxi';
      citytitle = '九江新闻';
    }

    const response = await got.get(host);
    const $ = cheerio.load(response.data);
    
    const list = $('div.right_text').get();
    
    const out = await Promise.all(
        list.map(async (item) => {
            const $ = cheerio.load(item);

            //const title = $('.list-text-style').text();
            const title = $('a').text();
            const itemUrl = url.resolve(host, $('a').attr('href'));
            //const itemUrl = 'https://tt.m.jxnews.com.cn' + '$('a').attr('href');                
            const cache = await ctx.cache.get(itemUrl);
            if (cache) {
                return Promise.resolve(JSON.parse(cache));
            }

            const res = await got.get(itemUrl);
            const capture = cheerio.load(res.data);
            const contents = capture('div.title_area').html();
            //const time = capture('div.col-xs-8').text().substring(0, 18);

            const single = {
                title,
                link: itemUrl,
                guid: itemUrl,
                description: contents,
                //pubDate: new Date(time).toUTCString(),
            };

            return Promise.resolve(single);
        })
    );

    ctx.state.data = {
        title: citytitle,
        link: host,
        item: out,
    };
};
