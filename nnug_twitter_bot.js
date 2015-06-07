var request = require("request");
var Codebird = require("codebird");
var config = require('mobileservice-config');

var cb = new Codebird();
cb.setConsumerKey(config.twitterConsumerKey, config.twitterConsumerSecret);
cb.setToken(config.appSettings.NNUG_TWITTER_ACCESS_TOKEN, config.appSettings.NNUG_TWITTER_ACCESS_TOKEN_SECRET);

//The upcoming meetup events URLs (signed) for each user group, the "page" parameter determines the max
var nnugOslo = "https://api.meetup.com/2/events?offset=0&format=json&limited_events=False&group_urlname=NNUGOslo&photo-host=public&page=20&fields=&order=time&desc=false&status=upcoming&sig_id=35617582&sig=eadcf896e2b735a18e8bb31157f7502ae8dc038c";
var nnugBergen = "https://api.meetup.com/2/events?offset=0&format=json&limited_events=False&group_urlname=NNUG-Bergen&photo-host=public&page=20&fields=&order=time&desc=false&status=upcoming&sig_id=35617582&sig=3c986d5987da6b7cdf69e37ea808a56cec73118c";
var nnugStavanger = "https://api.meetup.com/2/events?offset=0&format=json&limited_events=False&group_urlname=NNUG-Stavanger&photo-host=public&page=20&fields=&order=time&desc=false&status=upcoming&sig_id=35617582&sig=adb46c729fe91e53b46c857986591001d0694b30";
var nnugTrondheim = "https://api.meetup.com/2/events?offset=0&format=json&limited_events=False&group_urlname=NNUG-Trondheim&photo-host=public&page=20&fields=&order=time&desc=false&status=upcoming&sig_id=35617582&sig=eadb56f84dca1f1bd1e4f52354555ea1c8e9e7b6";
var nnugKristiansand = "https://api.meetup.com/2/events?offset=0&format=json&limited_events=False&group_urlname=NNUG-Kristiansand&photo-host=public&page=20&fields=&order=time&desc=false&status=upcoming&sig_id=35617582&sig=c5fef57825c7a154d81308822a6e999107204ec6";
var nnugVestfold = "https://api.meetup.com/2/events?offset=0&format=json&limited_events=False&group_urlname=NNUG-Vestfold&photo-host=public&page=20&fields=&order=time&desc=false&status=upcoming&sig_id=35617582&sig=11f4f19030543510b03c5cdfb6e7a11eeddab5f1";
var nnugHaugesund = "https://api.meetup.com/2/events?offset=0&format=json&limited_events=False&group_urlname=NNUG-Haugesund&photo-host=public&page=20&fields=&order=time&desc=false&status=upcoming&sig_id=35617582&sig=9c573e9f576217c29c2258525548e9f5371fd282";

//The vimeo videos URL, the "per_page" parameter determines the max, sorted by date descending
var nnugVimeo = "https://api.vimeo.com/users/nnug/videos?per_page=10&sort=date&direction=desc&access_token="+config.appSettings.NNUG_VIMEO_ACCESS_TOKEN;

function nnug_twitter_bot() {

    requestDataFromMeetupAndTweetFor(nnugOslo);
    requestDataFromMeetupAndTweetFor(nnugBergen);
    requestDataFromMeetupAndTweetFor(nnugStavanger);
    requestDataFromMeetupAndTweetFor(nnugTrondheim);
    requestDataFromMeetupAndTweetFor(nnugKristiansand);
    requestDataFromMeetupAndTweetFor(nnugVestfold);
    requestDataFromMeetupAndTweetFor(nnugHaugesund);
    requestDataFromVimeoAndTweetFor(nnugVimeo);

    function requestDataFromVimeoAndTweetFor(vimeoChannel) {
        request(vimeoChannel, function(error, response, body){
            var json = JSON.parse(body);
            if (!error && response.statusCode == 200) {
                for(var i = 0; i < json.data.length; i++) {
                    var dateCreated = json.data[i].created_time;                    
                    var name = json.data[i].name;
                    var videoUrl = json.data[i].link;
                    var message = buildMessageForVimeo(name, videoUrl);
                    if(getDaysInBetween(new Date(), new Date(json.data[i].created_time)) == -1) {                
                        tweet(message);
                    }
                }
            }
        });
    }

    function requestDataFromMeetupAndTweetFor(userGroup) {
        request(userGroup, function(error, response, body){
            var json = JSON.parse(body);
            if (!error && response.statusCode == 200) {
                for(var i = 0; i < json.results.length; i++) {
                    var dateCreated = new Date(parseInt(json.results[i].created));
                    var date = new Date(parseInt(json.results[i].time));
                    var name = json.results[i].name;
                    var eventUrl = json.results[i].event_url;
                    var groupUrlName = json.results[i].group.urlname;
                    var message = buildMessageForMeetup(name, date, eventUrl, groupUrlName);
    
                    if(getDaysInBetween(new Date(), dateCreated) == -1) {                
                        tweet(message);
                        continue;
                    }
    
                    switch(getDaysInBetween(new Date(), date)){
                        case 7:
                            message = buildMessageForMeetup(name, "1 week left", eventUrl, groupUrlName);
                            tweet(message);
                            break;
                        case 1:
                            message = buildMessageForMeetup(name, "tomorrow", eventUrl, groupUrlName);
                            tweet(message);
                            break;
                    }
                }
            }
        });
    }
    
    function buildMessageForVimeo(name, videoUrl) {
        var hashTags = "#NNUG";
        var message = "On Vimeo: " + "\"" + name + "\"" + " " + hashTags + " " + videoUrl;        
        if(message.length > 140) {
            var temp = message.replace(" " + videoUrl, "");
            return temp.replace("\"" + name + "\"", videoUrl);
        }
        return message;
    }
    
    function buildMessageForMeetup(name, date, eventUrl, groupUrlName) {
        var eventDate = isTypeOfDate(date) ? date.getDate() + "/" + (date.getMonth()+1) : date;    
        var hashTags = "#"+groupUrlName.replace("-", "");
        var message = name + " " + eventDate + ", RSVP today! " + hashTags + " " + eventUrl;
        if(message.length > 140) {
            return message.replace(name + " ", "");
        }
        return message;
    }
    
    function isTypeOfDate(date) {
        return Object.prototype.toString.call(date) === '[object Date]';
    }
    
    function getDaysInBetween(date1, date2) {
        var one_day_ms = 1000*60*60*24;
        var date1_ms = date1.getTime();
        var date2_ms = date2.getTime();
        var difference_ms = date2_ms - date1_ms;
        return Math.round(difference_ms/one_day_ms);
    }
    
    function tweet(message) {
        var params = {
            status: message
        };
        cb.__call(
            "statuses_update",
            params,
            function (reply) {
                console.log(reply);
            }
        );
    }
}