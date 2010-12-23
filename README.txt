The goal of this project is to store stats and other informational messages in a 
Redis (loss-able data) which can be later provided as an RSS feed.

This would provide a simpler "loss-able" way of communication among the team and 
provide the system with a way to talk to developers... sort of via commonly read RSS
feeds.

The following methods of communication are to be accepted
* Via Redis directly: pub-sub
* Via HTTP POST/GET
* More?

Also there will be a javascript templating system _underscore? to read the history data
and produce an rss feed.

Data Structures:
  The config.json holds the configuration information for Redis and the channels to use.
  
  The history_key is an array of "history_max_count" items.
  
SYSTEM REQUIREMENTS:
  node.js     @2.5    http://www.nodejs.org
  redis       @2.0    http://redis.io/

