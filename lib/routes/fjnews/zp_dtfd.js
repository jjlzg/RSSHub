const got = require('@/utils/got');
const cheerio = require('cheerio');
const url = require('url');

let host = 'http://www.cdtrczp.com/cdtrw/NewsCenter.aspx?type=2';
let citytitle = '大唐招聘';

module.exports = async (ctx) => {

    const response = await got({
        method: 'get',
        url: host,
        header: {
            Referer: 'http://www.cdtrczp.com',
        },
    });
    
    const $ = cheerio.load(response.data);
    let list = {};
    list = $('table.innerList tr')
    const out = [];

    for (let i = 0; i < list.length; i++) {
        const $ = cheerio.load(list[i]);
        const title = $('td.sp1').text();
	    //这里有'要替换所以用"
	const link = $('td').attr('onclick').replace("window.open('","").replace("')","");
	//console.log(link[i]);

        const itemUrl = url.resolve(host, link);
        const cache = await ctx.cache.get(itemUrl);

        if (cache) {
            return Promise.resolve(JSON.parse(cache));
        }

        const res = await got.get(itemUrl);
        const capture = cheerio.load(res.data);
        const contents = capture('div.re_news_contents').html();
        //const time = capture('div.col-xs-8').text().substring(0, 19);


	const single = {

                title,
                link: itemUrl,
                guid: itemUrl,
                description: contents,
                //pubDate: new Date(time).toUTCString(),

            };
          out.push(single);
    }

   ctx.state.data = {
        title: citytitle,
        link: host,
        item: out,
    };

};

