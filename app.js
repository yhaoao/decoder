var request = require('request');
var concat = require('concat-files');
var fs = require('fs');
var async = require('async');
var cheerio = require('cheerio');
var child_process = require('child_process');
var EventEmitter = require('events').EventEmitter;

var postUrl = 'http://ems.com.cn/ems/order/singleQuery_t';
var getUrl = 'http://ems.com.cn/mailtracking/you_jian_cha_xun.html';
var randUrl = 'http://ems.com.cn/ems/rand';

var j = request.jar()
var request = request.defaults({
    jar: j
});
var getResult = function(id, callback) {
    var writeStream = fs.createWriteStream('img/' + id + '.jpg')

    var randReq = request({
        url: randUrl + '?d=' + Math.random(),
        headers: {
            'Referer': 'http://ems.com.cn/mailtracking/you_jian_cha_xun.html',
        }
    }, function(error, response, body) {
        var cmd = 'python ' + process.cwd() + '/decode.py ' + 'img/' + id + '.jpg';
        child_process.exec(cmd, function(err, data) {
            var checkCode = data.trim();
            request({
                method: 'POST',
                url: postUrl,
                headers: {
                    'Referer': 'http://ems.com.cn/mailtracking/you_jian_cha_xun.html'
                },
                form: {
                    mailNum: id,
                    checkCode: checkCode
                }
            }, function(err, httpResponse, body) {
                if(!body) {
                    callback(null, '');
                    return;
                }
                var $ = cheerio.load(body);
                $('.mailnum_result_box').prepend('<h1>' + id + '</h1>');
                $('#checkCode').remove();
                $('#singleForm').remove();

                var content = $('.mailnum_result_box').html();

                if (callback) {
                    callback(null, content);
                }
            });
        });
    }).pipe(writeStream);
};


var texts = fs.readFileSync('text.txt').toString().split('\n');
var len = texts.length;


var iterate = function(texts, callback) {
    var originLen = texts.length;
    var remain = [];
    var emitter = new EventEmitter();
    emitter.on('iterated', function(data) {
        remain.push(data);
        if (remain.length === originLen) {
            callback(remain.filter(function(item) {
                return !item.content;
            }));
        }
    });
    texts.forEach(function(text, i) {
        setTimeout(function() {
            getResult(text, function(err, content) {
                fs.writeFileSync('result/' + text + '.html', content);

                emitter.emit('iterated', {
                    text: text,
                    content: content
                });
            });
        }, 1000 + i * 4000);
    });
};

var finish = function() {
    
    var files = texts.map(function(text) {
        return 'result/' + text + '.html';
    });
    concat(files, './result.html', function() {
        console.log('完成');
    });
}

var call = function(texts) {
    if (texts.length === 0) {
        finish();
        return;
    }

    iterate(texts.map(function(item) {
        return item.text;
    }), call);
}

iterate(texts, call);