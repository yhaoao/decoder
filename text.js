var cheerio = require('cheerio');
var fs = require('fs');


var html = fs.readFileSync('result/CL774107330DE.html');
var $ = cheerio.load(html);
$('<h1>' + 'CL774107330DE' + '</h1>').insertBefore('.mailnum_result_box')
$('.showTable').remove('#checkCode');
$('.mailnum_result_box').remove('#singleForm');

console.log($('#showTable').html());