const got = require('@/utils/got');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const url = require('url');

let host = 'http://www.0792gd.cn/zixun';
let citytitle = '九江九广网';

module.exports = async (ctx) => {
    const response = await got.get(host, {
        responseType: 'buffer',
    });
    //必须转码,否则乱码
    response.data = iconv.decode(response.data, 'gb2312');
    const $ = cheerio.load(response.data);
    const list = $('dt.dis').get();

    const out = await Promise.all(
        list.map(async (item) => {
            const $ = cheerio.load(item);            
            const title = $('a').eq(1).text();
            const itemUrl = url.resolve(host, $('a').attr('href'));
            const cache = await ctx.cache.get(itemUrl);           
                        
            if (cache) {
                return Promise.resolve(JSON.parse(cache));
            }

            const original_data = await got({
                    method: 'get',
                    url: itemUrl,
                    responseType: 'buffer',
                });
            const capture = iconv.decode(original_data.data, 'gb2312');
            
            const $1 = cheerio.load(capture);

            const contents = $1('div.content').html();
            //const time = $1('span.date fl-l').eq(0).text();

            const single = {
                title,
                link: itemUrl,
                guid: itemUrl,
                description: contents,
                //pubDate: time,
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
