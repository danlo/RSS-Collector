Redis Study - Stats Collector
=============================

The goal of this project is to store stats and other informational messages in a 
Redis (loss-able data) which can be later provided as an RSS feed.

This would provide a simpler "loss-able" way of communication among the team and 
provide the system with a way to talk to developers... sort of via commonly read RSS
feeds.  You could read this on your cell phone!

The following methods of communication are to be accepted
* Via Redis directly: pub-sub
* Via HTTP POST/GET
* More?

Data Structures:
----------------

The config.json holds the configuration information for Redis and the channels to use.

The history_key is an array of "history_max_count" items.

See lib/message.js for message structure

System Requirements:
--------------------
  node.js     @2.5    http://www.nodejs.org
  redis       @2.0    http://redis.io/
  nodeunit            - testing framework

